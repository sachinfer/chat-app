const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: { type: String, required: true },
  avatar: { type: String },
  text: { type: String, required: true },
  filePath: { type: String }, // To store the path of the shared file
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema); 