const express = require('express');
const Schedule = require('../models/Schedule');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// 모든 일정 라우트는 인증 필요
router.use(authMiddleware);

// 일정 생성
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      client,
      photographer,
      status,
      type,
      price,
      deposit,
      notes
    } = req.body;

    // 필수 필드 검증
    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '일정 제목, 시작 날짜, 종료 날짜는 필수입니다.'
      });
    }

    const schedule = new Schedule({
      title,
      description,
      startDate,
      endDate,
      location,
      client,
      photographer: photographer || req.user._id,
      status,
      type,
      price,
      deposit,
      notes,
      createdBy: req.user._id
    });

    await schedule.save();

    // Populate photographer 정보
    await schedule.populate('photographer', 'name email');
    await schedule.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: '일정이 생성되었습니다.',
      data: schedule
    });
  } catch (error) {
    console.error('일정 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '일정 생성 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 일정 목록 조회 (페이지네이션, 필터링)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { status, type, startDate, endDate, photographer } = req.query;

    // 필터 조건 구성
    let query = {};

    // 관리자가 아닌 경우 자신의 일정만 조회
    if (req.user.role !== 'admin') {
      query.photographer = req.user._id;
    } else if (photographer) {
      query.photographer = photographer;
    }

    if (status) query.status = status;
    if (type) query.type = type;

    // 날짜 범위 필터
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    const schedules = await Schedule.find(query)
      .populate('photographer', 'name email phone')
      .populate('createdBy', 'name email')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Schedule.countDocuments(query);

    res.json({
      success: true,
      data: {
        schedules,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('일정 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '일정 목록을 가져오는 중 오류가 발생했습니다.'
    });
  }
});

// 캘린더용 일정 조회 (월별)
router.get('/calendar', async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: '년도와 월을 지정해주세요.'
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let query = {
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } },
        {
          startDate: { $lte: startDate },
          endDate: { $gte: endDate }
        }
      ]
    };

    // 관리자가 아닌 경우 자신의 일정만 조회
    if (req.user.role !== 'admin') {
      query.photographer = req.user._id;
    }

    const schedules = await Schedule.find(query)
      .populate('photographer', 'name email')
      .sort({ startDate: 1 });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('캘린더 일정 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '캘린더 일정을 가져오는 중 오류가 발생했습니다.'
    });
  }
});

// 특정 일정 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('photographer', 'name email phone')
      .populate('createdBy', 'name email');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '일정을 찾을 수 없습니다.'
      });
    }

    // 권한 확인 (관리자 또는 담당 사진작가만 조회 가능)
    if (req.user.role !== 'admin' && schedule.photographer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '이 일정을 조회할 권한이 없습니다.'
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('일정 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '일정을 가져오는 중 오류가 발생했습니다.'
    });
  }
});

// 일정 수정
router.put('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '일정을 찾을 수 없습니다.'
      });
    }

    // 권한 확인 (관리자 또는 생성자만 수정 가능)
    if (req.user.role !== 'admin' && schedule.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '이 일정을 수정할 권한이 없습니다.'
      });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      client,
      photographer,
      status,
      type,
      price,
      deposit,
      notes
    } = req.body;

    // 업데이트할 필드만 적용
    if (title !== undefined) schedule.title = title;
    if (description !== undefined) schedule.description = description;
    if (startDate !== undefined) schedule.startDate = startDate;
    if (endDate !== undefined) schedule.endDate = endDate;
    if (location !== undefined) schedule.location = location;
    if (client !== undefined) schedule.client = client;
    if (photographer !== undefined) schedule.photographer = photographer;
    if (status !== undefined) schedule.status = status;
    if (type !== undefined) schedule.type = type;
    if (price !== undefined) schedule.price = price;
    if (deposit !== undefined) schedule.deposit = deposit;
    if (notes !== undefined) schedule.notes = notes;

    await schedule.save();
    await schedule.populate('photographer', 'name email');
    await schedule.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: '일정이 수정되었습니다.',
      data: schedule
    });
  } catch (error) {
    console.error('일정 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '일정 수정 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 일정 삭제
router.delete('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '일정을 찾을 수 없습니다.'
      });
    }

    // 권한 확인 (관리자 또는 생성자만 삭제 가능)
    if (req.user.role !== 'admin' && schedule.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '이 일정을 삭제할 권한이 없습니다.'
      });
    }

    await Schedule.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '일정이 삭제되었습니다.'
    });
  } catch (error) {
    console.error('일정 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '일정 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 일정 통계 (관리자 전용)
router.get('/stats/summary', adminMiddleware, async (req, res) => {
  try {
    const totalSchedules = await Schedule.countDocuments();
    const upcomingSchedules = await Schedule.countDocuments({
      startDate: { $gte: new Date() },
      status: { $ne: '취소' }
    });
    const completedSchedules = await Schedule.countDocuments({ status: '완료' });
    const cancelledSchedules = await Schedule.countDocuments({ status: '취소' });

    // 이번 달 일정
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const thisMonthSchedules = await Schedule.countDocuments({
      startDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // 타입별 통계
    const schedulesByType = await Schedule.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // 수입 통계
    const revenue = await Schedule.aggregate([
      { $match: { status: '완료' } },
      { $group: { _id: null, total: { $sum: '$price' }, totalDeposit: { $sum: '$deposit' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalSchedules,
        upcomingSchedules,
        completedSchedules,
        cancelledSchedules,
        thisMonthSchedules,
        schedulesByType,
        revenue: revenue[0] || { total: 0, totalDeposit: 0 }
      }
    });
  } catch (error) {
    console.error('일정 통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계를 가져오는 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
