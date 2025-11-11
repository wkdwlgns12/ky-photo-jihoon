const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const User = require('../models/User');
const Photo = require('../models/Photo');
const Event = require('../models/Event');
const Album = require('../models/Album');

// 관리자 권한 체크 미들웨어
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '관리자 권한이 필요합니다' });
  }
  next();
};

// 대시보드 통계
router.get('/dashboard/stats', auth, adminOnly, async (req, res) => {
  try {
    const [userCount, photoCount, eventCount, albumCount, recentUsers] = await Promise.all([
      User.countDocuments(),
      Photo.countDocuments(),
      Event.countDocuments(),
      Album.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(10).select('-password')
    ]);

    // 저장공간 사용량
    const storageResult = await Photo.aggregate([
      { $group: { _id: null, total: { $sum: '$fileSize' } } }
    ]);
    const totalStorage = storageResult.length > 0 ? storageResult[0].total : 0;

    // 최근 활동
    const recentPhotos = await Photo.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('ownerId', 'email displayName');

    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('ownerId', 'email displayName');

    res.json({
      stats: {
        users: userCount,
        photos: photoCount,
        events: eventCount,
        albums: albumCount,
        storageUsed: totalStorage,
        storageUsedMB: (totalStorage / (1024 * 1024)).toFixed(2)
      },
      recentUsers,
      recentPhotos,
      recentEvents
    });
  } catch (err) {
    res.status(500).json({ message: '통계 조회 실패', error: err.message });
  }
});

// 전체 사용자 목록
router.get('/users', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count
    });
  } catch (err) {
    res.status(500).json({ message: '사용자 목록 조회 실패', error: err.message });
  }
});

// 사용자 상세 조회
router.get('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });

    // 사용자 콘텐츠 통계
    const [photos, events, albums] = await Promise.all([
      Photo.find({ ownerId: req.params.id }).sort({ createdAt: -1 }).limit(10),
      Event.find({ ownerId: req.params.id }).sort({ createdAt: -1 }).limit(10),
      Album.find({ ownerId: req.params.id }).sort({ createdAt: -1 }).limit(10)
    ]);

    res.json({ user, photos, events, albums });
  } catch (err) {
    res.status(500).json({ message: '사용자 조회 실패', error: err.message });
  }
});

// 사용자 역할 변경
router.patch('/users/:id/role', auth, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: '잘못된 역할입니다' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });

    res.json({ message: '역할이 변경되었습니다', user });
  } catch (err) {
    res.status(500).json({ message: '역할 변경 실패', error: err.message });
  }
});

// 사용자 계정 활성화/비활성화
router.patch('/users/:id/status', auth, adminOnly, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다' });

    res.json({ message: '계정 상태가 변경되었습니다', user });
  } catch (err) {
    res.status(500).json({ message: '상태 변경 실패', error: err.message });
  }
});

// 사용자 삭제 (모든 데이터 포함)
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;

    // 본인은 삭제 불가
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: '본인 계정은 삭제할 수 없습니다' });
    }

    // 사용자 데이터 모두 삭제
    await Promise.all([
      User.findByIdAndDelete(userId),
      Photo.deleteMany({ ownerId: userId }),
      Event.deleteMany({ ownerId: userId }),
      Album.deleteMany({ ownerId: userId })
    ]);

    res.json({ message: '사용자와 모든 데이터가 삭제되었습니다' });
  } catch (err) {
    res.status(500).json({ message: '사용자 삭제 실패', error: err.message });
  }
});

// 전체 사진 목록
router.get('/photos', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }

    const photos = await Photo.find(query)
      .populate('ownerId', 'email displayName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

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

// 전체 일정 목록
router.get('/events', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }

    const events = await Event.find(query)
      .populate('ownerId', 'email displayName')
      .sort({ startAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalCount: count
    });
  } catch (err) {
    res.status(500).json({ message: '일정 목록 조회 실패', error: err.message });
  }
});

// 사진 삭제 (관리자)
router.delete('/photos/:id', auth, adminOnly, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ message: '사진을 찾을 수 없습니다' });

    // TODO: S3에서도 삭제

    res.json({ message: '사진이 삭제되었습니다' });
  } catch (err) {
    res.status(500).json({ message: '사진 삭제 실패', error: err.message });
  }
});

// 일정 삭제 (관리자)
router.delete('/events/:id', auth, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ message: '일정을 찾을 수 없습니다' });

    res.json({ message: '일정이 삭제되었습니다' });
  } catch (err) {
    res.status(500).json({ message: '일정 삭제 실패', error: err.message });
  }
});

module.exports = router;