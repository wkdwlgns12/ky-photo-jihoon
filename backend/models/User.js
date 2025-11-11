const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, index: true, required: true },
  password: { type: String, required: true },
  displayName: { type: String, default: '' },
  role: { type: String, enum: ['user','admin'], default: 'user' }
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);
