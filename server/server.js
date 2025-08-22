// server/server.js
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

/* ------------------------- ENV ------------------------- */
const {
  PORT = 5000,
  MONGODB_URI = 'mongodb://127.0.0.1:27017/realtime_chat',
  // Comma-separated origins, e.g. "http://localhost:3000,https://your-netlify.app"
  CLIENT_ORIGIN = 'http://localhost:3000',
  JWT_SECRET = 'change_me'
} = process.env;

const allowedOrigins = CLIENT_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);

/* ------------------------- DB -------------------------- */
mongoose.set('strictQuery', true);
await mongoose.connect(MONGODB_URI, { maxPoolSize: 10 });
console.log('✅ MongoDB connected');

/* ----------------------- MODELS ------------------------ */
const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    username: { type: String, unique: true, required: true, trim: true, minlength: 3, maxlength: 24 },
    email:    { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: true } // bcrypt hash
  },
  { timestamps: true }
);
const User = model('User', userSchema);

const messageSchema = new Schema(
  {
    room: { type: String, index: true, required: true },
    username: { type: String, required: true }, // denormalized username
    text: { type: String, required: true }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
messageSchema.index({ room: 1, createdAt: -1 });
const Message = model('Message', messageSchema);

/* -------------------- AUTH HELPERS --------------------- */
function signToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = verifyToken(token); // { id, username }
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/* ---------------------- APP SETUP ---------------------- */
const app = express();
const server = http.createServer(app);

// CORS: allow multiple origins (localhost + deployed client)
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);              // allow curl/postman
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS blocked for ' + origin));
    },
    credentials: true
  })
);
app.use(express.json());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });

/* ----------------------- ROUTES ------------------------ */
app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/auth/register', authLimiter, async (req, res) => {
  try {
    const { username, password, email } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (username.length < 3) return res.status(400).json({ error: 'Username too short' });
    if (password.length < 6) return res.status(400).json({ error: 'Password too short' });

    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: 'Username already taken' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hash });

    const token = signToken({ id: user._id, username: user.username });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: user._id, username: user.username });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Protected REST history (optional; socket also sends history)
app.get('/rooms/:room/messages', requireAuth, async (req, res) => {
  const { room } = req.params;
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const docs = await Message.find({ room }).sort({ createdAt: -1 }).limit(limit).lean();
  res.json(docs.reverse());
});

/* --------------------- SOCKET.IO SETUP ----------------- */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins
  }
});

// Verify JWT on socket handshake
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Missing auth token'));
  try {
    const user = verifyToken(token); // { id, username }
    socket.data.user = user;
    return next();
  } catch {
    return next(new Error('Invalid auth token'));
  }
});

// Track online users by room
const roomUsers = new Map(); // room -> Set(usernames)
const getOnline = (room) => Array.from(roomUsers.get(room) || []);

io.on('connection', (socket) => {
  console.log('🔌 socket connected:', socket.id, 'user:', socket.data.user?.username);

  socket.on('joinRoom', async ({ room }) => {
    const username = socket.data.user?.username;
    if (!room || !username) return;

    // Leave previous
    if (socket.data.room) {
      const prev = socket.data.room;
      socket.leave(prev);
      const set = roomUsers.get(prev);
      if (set) {
        set.delete(username);
        if (set.size === 0) roomUsers.delete(prev);
      }
      io.to(prev).emit('onlineUsers', getOnline(prev));
    }

    // Join new
    socket.data.room = room;
    socket.join(room);
    if (!roomUsers.has(room)) roomUsers.set(room, new Set());
    roomUsers.get(room).add(username);
    io.to(room).emit('onlineUsers', getOnline(room));

    // Send last 50 to joining user
    const history = await Message.find({ room }).sort({ createdAt: -1 }).limit(50).lean();
    socket.emit('chatHistory', history.reverse());
  });

  socket.on('chatMessage', async ({ text }) => {
    const username = socket.data.user?.username;
    const room = socket.data.room;
    if (!username || !room) return;
    const trimmed = (text || '').trim();
    if (!trimmed || trimmed.length > 1000) return;

    const doc = await Message.create({ room, username, text: trimmed });
    io.to(room).emit('chatMessage', {
      _id: doc._id,
      room: doc.room,
      username: doc.username,
      text: doc.text,
      createdAt: doc.createdAt
    });
  });

  socket.on('typing', ({ isTyping }) => {
    const username = socket.data.user?.username;
    const room = socket.data.room;
    if (!username || !room) return;
    socket.to(room).emit('typing', { username, isTyping: !!isTyping });
  });

  socket.on('disconnect', () => {
    const username = socket.data.user?.username;
    const room = socket.data.room;
    if (room && username) {
      const set = roomUsers.get(room);
      if (set) {
        set.delete(username);
        if (set.size === 0) roomUsers.delete(room);
      }
      io.to(room).emit('onlineUsers', getOnline(room));
    }
    console.log('❌ socket disconnected:', socket.id);
  });
});

/* ----------------------- START ------------------------ */
server.listen(PORT, () => {
  console.log(`🚀 Server listening on :${PORT}`);
});
