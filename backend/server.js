// Load environment variables
require("dotenv").config();

// Import dependencies
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const connectDB = require("./db");

// Connect to database
connectDB();

// Initialize app and server
const app = express();
const server = http.createServer(app);

// Apply middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Chat App Backend is running.");
});

// Setup Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your frontend domain in production
    methods: ["GET", "POST"]
  }
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error("Socket auth failed:", err.message);
    return next(new Error("Authentication error"));
  }
});

// Handle socket events
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

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
