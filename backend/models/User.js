const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, index: true, required: true },
  password: { type: String, required: true },
  displayName: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  // 프로필 정보
  profile: {
    avatar: String,
    bio: String,
    phone: String,
    website: String
  },
  
  // 설정
  settings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
    language: { type: String, default: 'ko' }
  },
  
  // 통계
  stats: {
    photoCount: { type: Number, default: 0 },
    eventCount: { type: Number, default: 0 },
    albumCount: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 } // bytes
  },
  
  // 계정 상태
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);