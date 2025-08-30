import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const {
  PORT = 5000,
  MONGODB_URI,
  CLIENT_ORIGIN = "http://localhost:3000",
} = process.env;

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET","POST"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
app.use(express.json());

// ✅ MongoDB (optional, if you use Atlas)
mongoose.connect(MONGODB_URI, { maxPoolSize: 10 })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// -----------------------------
// In-memory storage (same as before, now supports dynamic rooms)
// -----------------------------
let rooms = ["general", "random", "tech", "music"];
let messages = { general: [], random: [], tech: [], music: [] };
let onlineUsers = {}; // { room: [usernames] }

// -----------------------------
// REST API for creating new rooms
// -----------------------------
app.get("/rooms", (req, res) => {
  res.json(rooms);
});

app.post("/rooms", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Room name required" });
  if (rooms.includes(name)) return res.status(400).json({ error: "Room already exists" });

  rooms.push(name);
  messages[name] = [];
  onlineUsers[name] = [];
  io.emit("roomsUpdated", rooms); // 🔥 notify clients
  res.json({ success: true, rooms });
});

// -----------------------------
// Socket.io
// -----------------------------
const io = new Server(server, {
  cors: { origin: true, credentials: true, methods: ["GET","POST"] }
});

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  // Join room
  socket.on("joinRoom", ({ room, username }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    // send last 50 messages of that room
    if (!messages[room]) messages[room] = [];
    socket.emit("chatHistory", messages[room].slice(-50));

    // add to online users
    if (!onlineUsers[room]) onlineUsers[room] = [];
    if (!onlineUsers[room].includes(username)) {
      onlineUsers[room].push(username);
    }
    io.to(room).emit("onlineUsers", onlineUsers[room]);
  });

  // Chat messages
  socket.on("chatMessage", ({ room, username, text }) => {
    if (!room || !username || !text) return;
    const msg = { username, text, createdAt: new Date() };
    messages[room].push(msg);
    io.to(room).emit("chatMessage", msg);
  });

  // Typing indicator
  socket.on("typing", ({ room, username, isTyping }) => {
    socket.to(room).emit("typing", { username, isTyping });
  });

  // Disconnect
  socket.on("disconnect", () => {
    const { room, username } = socket;
    if (room && onlineUsers[room]) {
      onlineUsers[room] = onlineUsers[room].filter(u => u !== username);
      io.to(room).emit("onlineUsers", onlineUsers[room]);
    }
    console.log("❌ Client disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("✅ Realtime Chat Server running!");
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
