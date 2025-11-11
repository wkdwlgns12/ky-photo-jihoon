const mongoose = require('mongoose');

const AlbumSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  coverPhotoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo' },
  
  // 공유 설정
  isPublic: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // 통계
  photoCount: { type: Number, default: 0 },
  
  // 정렬
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Album', AlbumSchema);