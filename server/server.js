import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const {
  PORT = 5000,
  MONGODB_URI,
  CLIENT_ORIGIN,
  JWT_SECRET = "change_me"
} = process.env;

const app = express();
const server = http.createServer(app);

// ✅ Step 1: TEMPORARY permissive CORS (allow all origins, will lock later)
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));
app.options("*", cors({
  origin: true,
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json());

// ✅ Step 2: Connect to MongoDB Atlas
mongoose.connect(MONGODB_URI, { maxPoolSize: 10 })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// ✅ Step 3: Socket.io setup
const io = new Server(server, {
  cors: { origin: true, credentials: true, methods: ["GET","POST"] }
});

io.on("connection", (socket) => {
  console.log("⚡ New client connected:", socket.id);

  socket.on("joinRoom", ({ room }) => {
    socket.join(room);
    console.log(`📌 ${socket.id} joined room ${room}`);
  });

  socket.on("chatMessage", (msg) => {
    io.to(msg.room).emit("chatMessage", msg);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Step 4: Simple Guest Auth route
app.post("/auth/guest", (req, res) => {
  const username = req.body.username || `Guest_${Math.floor(Math.random()*1000)}`;
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

  res.json({ token, user: { username } });
});

// ✅ Step 5: Test route
app.get("/", (req, res) => {
  res.send("✅ Realtime Chat Server running!");
});

// ✅ Step 6: Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
