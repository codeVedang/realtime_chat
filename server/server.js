// server/server.js
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';

// use your helpers from auth.js
import { hashPassword, verifyPassword, signToken, verifyToken, requireAuth } from './auth.js';

const {
  PORT = 5000,
  MONGODB_URI,
  JWT_SECRET = 'change_me' // used by auth.js too
} = process.env;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in env');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);

/* -------------------- PERMISSIVE CORS (temp) -------------------- */
/* After verifying it works, you can lock this down to specific origins */
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.options('*', cors({
  origin: true,
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

app.use(express.json());

/* ------------------------ MongoDB connect ----------------------- */
mongoose.set('strictQuery', true);
mongoose.connect(MONGODB_URI, { maxPoolSize: 10 })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

/* ---------------------------- Models ---------------------------- */
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

/* ---------------------------- Routes ---------------------------- */
app.get('/health', (_req, res) => res.json({ ok: true }));

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    if (username.length < 3)   return res.status(400).json({ error: 'Username too short' });
    if (password.length < 6)   return res.status(400).json({ error: 'Password too short' });

    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: 'Username already taken' });

    const hashed = await hashPassword(password);
    const user = await User.create({ username, email, password: hashed });

    const token = signToken({ id: user._id, username: user.username });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await verifyPassword(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ id: user._id, username: user.username });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Guest token (for quick demos)
app.post('/auth/guest', async (req, res) => {
  try {
    const username = (req.body?.username || '').trim();
    if (!username || username.length < 3) return res.status(400).json({ error: 'username required' });
    const token = signToken({ id: `guest:${username}`, username }, '7d');
    res.json({ token, user: { id: `guest:${username}`, username } });
  } catch (e) {
    console.error('Guest error:', e);
    res.status(500).json({ error: 'guest failed' });
  }
});

// Protected REST history (send Authorization: Bearer <token>)
app.get('/rooms/:room/messages', requireAuth, async (req, res) => {
  const { room } = req.params;
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const docs = await Message.find({ room }).sort({ createdAt: -1 }).limit(limit).lean();
  res.json(docs.reverse());
});

/* -------------------------- Socket.io -------------------------- */
const io = new Server(server, {
  cors: { origin: true, credentials: true, methods: ['GET','POST'] }
});

// JWT auth on handshake (expects client to connect with io(URL, { auth: { token } }))
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Missing auth token'));
  try {
    const user = verifyToken(token); // { id, username }
    socket.data.user = user;
    next();
  } catch {
    next(new Error('Invalid auth token'));
  }
});

const roomUsers = new Map(); // room -> Set(usernames)
const getOnline = (room) => Array.from(roomUsers.get(room) || []);

io.on('connection', (socket) => {
  console.log('🔌 socket connected:', socket.id, 'user:', socket.data.user?.username);

  socket.on('joinRoom', async ({ room }) => {
    const username = socket.data.user?.username;
    if (!room || !username) return;

    // leave previous room
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

    // join new room
    socket.data.room = room;
    socket.join(room);
    if (!roomUsers.has(room)) roomUsers.set(room, new Set());
    roomUsers.get(room).add(username);
    io.to(room).emit('onlineUsers', getOnline(room));

    // send last 50 messages only to the joining user
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

/* --------------------------- Start ----------------------------- */
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
