const mongoose = require('mongoose');

const userBehaviorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  action: { type: String, required: true },
  metadata: { type: Object },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserBehavior', userBehaviorSchema); 