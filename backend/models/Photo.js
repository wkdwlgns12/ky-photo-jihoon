const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  s3Key: { type: String, required: true },
  s3Url: { type: String, required: true },
  
  // 메타데이터
  originalName: { type: String },
  mimeType: { type: String },
  fileSize: { type: Number },
  
  // 앨범 및 분류
  albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
  tags: [{ type: String, index: true }],
  category: { type: String, enum: ['portrait', 'landscape', 'event', 'food', 'other'], default: 'other' },
  
  // 촬영 정보
  takenAt: { type: Date },
  location: { type: String },
  
  // 소셜 기능
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likesCount: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: false },
  
  // EXIF 데이터 (선택적)
  exif: {
    camera: String,
    lens: String,
    iso: Number,
    aperture: String,
    shutterSpeed: String,
    focalLength: String
  }
}, { timestamps: true });

// 텍스트 검색 인덱스
PhotoSchema.index({ title: 'text', description: 'text', tags: 'text' });

// 좋아요 수 업데이트 메서드
PhotoSchema.methods.updateLikesCount = function() {
  this.likesCount = this.likes.length;
  return this.save();
};

module.exports = mongoose.model('Photo', PhotoSchema);