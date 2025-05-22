const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String }, // URL or base64
  createdAt: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false },
  canViewBehavior: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', userSchema); 