const express = require('express');
const router = express.Router();
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const auth = require('../middlewares/auth');
const Photo = require('../models/Photo');
const Album = require('../models/Album');
const User = require('../models/User');

// S3 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('이미지 파일만 업로드 가능합니다'));
    }
  }
});

// 사진 목록 조회
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, tags, albumId, category } = req.query;
    const query = { ownerId: req.user._id };

    if (search) query.$text = { $search: search };
    if (tags) query.tags = { $in: tags.split(',') };
    if (albumId) query.albumId = albumId;
    if (category) query.category = category;

    const photos = await Photo.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('albumId', 'title');

    const count = await Photo.countDocuments(query);

    res.json({
      photos,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count
    });
  } catch (err) {
    res.status(500).json({ message: '사진 목록 조회 실패', error: err.message });
  }
});

// 사진 업로드
router.post('/upload', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '파일이 없습니다' });
    }

    const { title, description, tags, albumId, category, takenAt, location } = req.body;
    const file = req.file;
    const s3Key = `photos/${req.user._id}/${Date.now()}-${file.originalname}`;

    // S3 업로드
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    });

    await s3Client.send(uploadCommand);
    const s3Url = `${process.env.S3_BASE_URL}/${s3Key}`;

    // DB 저장
    const photo = await Photo.create({
      ownerId: req.user._id,
      title: title || '',
      description: description || '',
      s3Key,
      s3Url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      albumId: albumId || null,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      category: category || 'other',
      takenAt: takenAt || new Date(),
      location: location || ''
    });

    // 사용자 통계 업데이트
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.photoCount': 1, 'stats.storageUsed': file.size }
    });

    // 앨범 사진 수 업데이트
    if (albumId) {
      await Album.findByIdAndUpdate(albumId, { $inc: { photoCount: 1 } });
    }

    res.status(201).json({ message: '사진이 업로드되었습니다', photo });
  } catch (err) {
    res.status(500).json({ message: '사진 업로드 실패', error: err.message });
  }
});

// 사진 상세 조회
router.get('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id)
      .populate('ownerId', 'displayName email')
      .populate('albumId', 'title');

    if (!photo) {
      return res.status(404).json({ message: '사진을 찾을 수 없습니다' });
    }

    // 본인 사진이거나 공개 사진만 조회 가능
    if (photo.ownerId._id.toString() !== req.user._id.toString() && !photo.isPublic) {
      return res.status(403).json({ message: '접근 권한이 없습니다' });
    }

    res.json({ photo });
  } catch (err) {
    res.status(500).json({ message: '사진 조회 실패', error: err.message });
  }
});

// 사진 정보 수정
router.patch('/:id', auth, async (req, res) => {
  try {
    const { title, description, tags, albumId, category, takenAt, location, isPublic } = req.body;
    
    const photo = await Photo.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!photo) {
      return res.status(404).json({ message: '사진을 찾을 수 없습니다' });
    }

    const oldAlbumId = photo.albumId;

    if (title !== undefined) photo.title = title;
    if (description !== undefined) photo.description = description;
    if (tags !== undefined) photo.tags = tags.split(',').map(t => t.trim());
    if (albumId !== undefined) photo.albumId = albumId || null;
    if (category !== undefined) photo.category = category;
    if (takenAt !== undefined) photo.takenAt = takenAt;
    if (location !== undefined) photo.location = location;
    if (isPublic !== undefined) photo.isPublic = isPublic;

    await photo.save();

    // 앨범 변경 시 사진 수 업데이트
    if (oldAlbumId && oldAlbumId.toString() !== albumId) {
      await Album.findByIdAndUpdate(oldAlbumId, { $inc: { photoCount: -1 } });
    }
    if (albumId && oldAlbumId?.toString() !== albumId) {
      await Album.findByIdAndUpdate(albumId, { $inc: { photoCount: 1 } });
    }

    res.json({ message: '사진 정보가 수정되었습니다', photo });
  } catch (err) {
    res.status(500).json({ message: '사진 수정 실패', error: err.message });
  }
});

// 사진 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!photo) {
      return res.status(404).json({ message: '사진을 찾을 수 없습니다' });
    }

    // S3에서 삭제
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: photo.s3Key
    });
    await s3Client.send(deleteCommand);

    // DB에서 삭제
    await photo.deleteOne();

    // 사용자 통계 업데이트
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.photoCount': -1, 'stats.storageUsed': -photo.fileSize }
    });

    // 앨범 사진 수 업데이트
    if (photo.albumId) {
      await Album.findByIdAndUpdate(photo.albumId, { $inc: { photoCount: -1 } });
    }

    res.json({ message: '사진이 삭제되었습니다' });
  } catch (err) {
    res.status(500).json({ message: '사진 삭제 실패', error: err.message });
  }
});

// 좋아요 토글
router.post('/:id/like', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: '사진을 찾을 수 없습니다' });
    }

    const userId = req.user._id;
    const likeIndex = photo.likes.indexOf(userId);

    if (likeIndex > -1) {
      // 좋아요 취소
      photo.likes.splice(likeIndex, 1);
    } else {
      // 좋아요 추가
      photo.likes.push(userId);
    }

    await photo.updateLikesCount();

    res.json({ 
      message: likeIndex > -1 ? '좋아요를 취소했습니다' : '좋아요를 눌렀습니다',
      likesCount: photo.likesCount,
      isLiked: likeIndex === -1
    });
  } catch (err) {
    res.status(500).json({ message: '좋아요 처리 실패', error: err.message });
  }
});

// 태그 검색
router.get('/tags/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ tags: [] });

    const photos = await Photo.find({
      ownerId: req.user._id,
      tags: { $regex: q, $options: 'i' }
    }).select('tags');

    const allTags = photos.flatMap(p => p.tags);
    const uniqueTags = [...new Set(allTags)].filter(tag => 
      tag.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 10);

    res.json({ tags: uniqueTags });
  } catch (err) {
    res.status(500).json({ message: '태그 검색 실패', error: err.message });
  }
});

module.exports = router;