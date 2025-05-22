const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const auth = require('../middleware/auth');
const Message = require('../models/Message');

// Helper function to validate email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, isAdmin, canViewBehavior } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, isAdmin: !!isAdmin, canViewBehavior: !!canViewBehavior });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Example protected route
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile
router.put('/me', auth, async (req, res) => {
  try {
    const updates = {};
    const { username, email, password, avatar } = req.body;
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (avatar) updates.avatar = avatar;
    if (password) updates.password = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true }).select('-password');
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ADMIN: Get all users
router.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username email avatar createdAt');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Get analytics stats
router.get('/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Message.countDocuments();
    // Messages per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const messages = await Message.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    res.json({ totalUsers, totalMessages, messagesPerDay: messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN: Grant canViewBehavior to a user
router.post('/admin/grant-behavior', async (req, res) => {
  try {
    const { email, username } = req.body;
    if (!email && !username) return res.status(400).json({ error: 'Email or username required' });
    const user = await User.findOne(email ? { email } : { username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.canViewBehavior = true;
    await user.save();
    res.json({ message: 'Access granted', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 