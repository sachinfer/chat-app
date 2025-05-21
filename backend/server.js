<<<<<<< HEAD
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
=======
// server.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: '*' }
});
const PORT = process.env.PORT || 5000;
const axios = require('axios');
const multer = require('multer');
const path = require('path');

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}


const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat-app';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const userRoutes = require('./routes/user');
const behaviorRoutes = require('./routes/behavior');
const Message = require('./models/Message');
const ollamaRoute = require('./routes/ollama');

app.get('/', (req, res) => {
  res.send('Chat App Backend Running');
});

app.use('/api/users', userRoutes);
app.use('/api/behavior', behaviorRoutes);
app.use('/api/ollama', ollamaRoute);

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  // req.file contains information about the uploaded file
  // We'll send back the path to the file, which can be used to access it
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

// Socket.io chat logic
let onlineUsers = 0;

io.on('connection', async (socket) => {
  onlineUsers++;
  io.emit('onlineUsers', onlineUsers);
  // Load last 50 messages from DB
  const history = await Message.find().sort({ createdAt: 1 }).limit(50);
  socket.emit('chatHistory', history);

  socket.on('chatMessage', async (msg) => {
    console.log('Received chatMessage:', msg);
    if (msg.text.startsWith('/bot')) {
      console.log('Forwarding to Ollama:', msg.text);
      const prompt = msg.text.replace(/^\/bot\s*/, '');
      try {
        const ollamaRes = await axios.post('http://localhost:11434/api/generate', {
          model: 'llama3.2:1b', // <-- use your actual model name
          prompt,
        });
        console.log('Ollama raw response:', ollamaRes.data);
        const botMsg = {
          user: 'Ollama',
          text: ollamaRes.data.response || 'No response',
          avatar: '',
          createdAt: new Date().toISOString(),
        };
        const message = new Message(botMsg);
        await message.save();
        io.emit('chatMessage', message);
      } catch (err) {
        console.error('Ollama error:', err);
        const botMsg = {
          user: 'Ollama',
          text: 'Ollama error: ' + (err.response?.data?.error || err.message),
          avatar: '',
          createdAt: new Date().toISOString(),
        };
        const message = new Message(botMsg);
        await message.save();
        io.emit('chatMessage', message);
      }
      return;
    }
    // Normal user message
    const message = new Message(msg);
    await message.save();
    io.emit('chatMessage', message);
  });

  socket.on('deleteMessage', async (id) => {
    const message = await Message.findById(id);
    if (message) {
      // Only allow the user who sent the message to delete it
      // (userId is sent in the message object)
      // In production, use authentication to verify user
      await Message.deleteOne({ _id: id });
      io.emit('deleteMessage', id);
    }
  });

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('onlineUsers', onlineUsers);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
>>>>>>> baf8337 (inint changes)
