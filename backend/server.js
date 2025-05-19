const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// sample endpoint
app.get("/", (req, res) => {
  res.send("Chat App Backend is running.");
});

// socket handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("send_message", (data) => {
    io.emit("receive_message", data); // broadcast
  });
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));

const connectDB = require("./db");
connectDB();

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./db");
const jwt = require("jsonwebtoken");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// 🧠 Set up Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // set frontend domain in prod
    methods: ["GET", "POST"]
  }
});

// 🧠 Middleware to check JWT on socket connection
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // we'll access socket.user.id later
    next();
  } catch (err) {
    console.error("Socket auth failed:", err.message);
    return next(new Error("Authentication error"));
  }
});

// ✅ Socket Events
io.on("connection", (socket) => {
  console.log(`✅ ${socket.user.id} connected via socket`);

  socket.on("chatMessage", (msg) => {
    io.emit("chatMessage", {
      userId: socket.user.id,
      message: msg,
    });
  });

  socket.on("disconnect", () => {
    console.log(`❌ ${socket.user.id} disconnected`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
