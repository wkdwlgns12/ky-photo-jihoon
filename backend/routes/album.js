const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Album = require('../models/Album');
const Photo = require('../models/Photo');
const User = require('../models/User');

// 앨범 목록 조회
router.get('/', auth, async (req, res) => {
  try {
    const albums = await Album.find({ ownerId: req.user._id })
      .sort({ sortOrder: 1, createdAt: -1 })
      .populate('coverPhotoId');

    res.json({ albums });
  } catch (err) {
    res.status(500).json({ message: '앨범 목록 조회 실패', error: err.message });
  }
});

// 앨범 생성
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, isPublic } = req.body;

    if (!title) {
      return res.status(400).json({ message: '제목은 필수입니다' });
    }

    const album = await Album.create({
      ownerId: req.user._id,
      title,
      description: description || '',
      isPublic: isPublic || false
    });

    // 사용자 통계 업데이트
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.albumCount': 1 }
    });

    res.status(201).json({ message: '앨범이 생성되었습니다', album });
  } catch (err) {
    res.status(500).json({ message: '앨범 생성 실패', error: err.message });
  }
});

// 앨범 상세 조회 (사진 포함)
router.get('/:id', auth, async (req, res) => {
  try {
    const album = await Album.findOne({ 
      _id: req.params.id, 
      ownerId: req.user._id 
    }).populate('coverPhotoId');

    if (!album) {
      return res.status(404).json({ message: '앨범을 찾을 수 없습니다' });
    }

    // 앨범의 사진들 조회
    const photos = await Photo.find({ albumId: req.params.id })
      .sort({ createdAt: -1 });

    res.json({ album, photos });
  } catch (err) {
    res.status(500).json({ message: '앨범 조회 실패', error: err.message });
  }
});

// 앨범 수정
router.patch('/:id', auth, async (req, res) => {
  try {
    const { title, description, coverPhotoId, isPublic, sortOrder } = req.body;

    const album = await Album.findOne({ 
      _id: req.params.id, 
      ownerId: req.user._id 
    });

    if (!album) {
      return res.status(404).json({ message: '앨범을 찾을 수 없습니다' });
    }

    if (title !== undefined) album.title = title;
    if (description !== undefined) album.description = description;
    if (coverPhotoId !== undefined) album.coverPhotoId = coverPhotoId;
    if (isPublic !== undefined) album.isPublic = isPublic;
    if (sortOrder !== undefined) album.sortOrder = sortOrder;

    await album.save();

    res.json({ message: '앨범이 수정되었습니다', album });
  } catch (err) {
    res.status(500).json({ message: '앨범 수정 실패', error: err.message });
  }
});

// 앨범 삭제
router.delete('/:id', auth, async (req, res) => {
  try {
    const album = await Album.findOne({ 
      _id: req.params.id, 
      ownerId: req.user._id 
    });

    if (!album) {
      return res.status(404).json({ message: '앨범을 찾을 수 없습니다' });
    }

    // 앨범의 사진들 albumId 제거
    await Photo.updateMany(
      { albumId: req.params.id },
      { $unset: { albumId: 1 } }
    );

    await album.deleteOne();

    // 사용자 통계 업데이트
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.albumCount': -1 }
    });

    res.json({ message: '앨범이 삭제되었습니다' });
  } catch (err) {
    res.status(500).json({ message: '앨범 삭제 실패', error: err.message });
  }
});

// 앨범에 사진 추가
router.post('/:id/photos/:photoId', auth, async (req, res) => {
  try {
    const album = await Album.findOne({ 
      _id: req.params.id, 
      ownerId: req.user._id 
    });

    if (!album) {
      return res.status(404).json({ message: '앨범을 찾을 수 없습니다' });
    }

    const photo = await Photo.findOne({
      _id: req.params.photoId,
      ownerId: req.user._id
    });

    if (!photo) {
      return res.status(404).json({ message: '사진을 찾을 수 없습니다' });
    }

    const oldAlbumId = photo.albumId;
    photo.albumId = req.params.id;
    await photo.save();

    // 앨범 사진 수 업데이트
    if (oldAlbumId) {
      await Album.findByIdAndUpdate(oldAlbumId, { $inc: { photoCount: -1 } });
    }
    await Album.findByIdAndUpdate(req.params.id, { $inc: { photoCount: 1 } });

    res.json({ message: '사진이 앨범에 추가되었습니다' });
  } catch (err) {
    res.status(500).json({ message: '사진 추가 실패', error: err.message });
  }
});

// 앨범에서 사진 제거
router.delete('/:id/photos/:photoId', auth, async (req, res) => {
  try {
    const photo = await Photo.findOne({
      _id: req.params.photoId,
      ownerId: req.user._id,
      albumId: req.params.id
    });

    if (!photo) {
      return res.status(404).json({ message: '사진을 찾을 수 없습니다' });
    }

    photo.albumId = null;
    await photo.save();

    await Album.findByIdAndUpdate(req.params.id, { $inc: { photoCount: -1 } });

    res.json({ message: '사진이 앨범에서 제거되었습니다' });
  } catch (err) {
    res.status(500).json({ message: '사진 제거 실패', error: err.message });
  }
});

module.exports = router;