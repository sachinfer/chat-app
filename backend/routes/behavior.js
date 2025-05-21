const express = require('express');
const router = express.Router();
const UserBehavior = require('../models/UserBehavior');
const auth = require('../middleware/auth');

// Log user behavior
router.post('/', auth, async (req, res) => {
  try {
    const { action, metadata } = req.body;
    const userId = req.user.userId;
    const behavior = new UserBehavior({ userId, action, metadata });
    await behavior.save();
    res.status(201).json({ message: 'Behavior logged' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 