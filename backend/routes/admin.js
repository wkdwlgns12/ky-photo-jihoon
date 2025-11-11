const express = require('express');
const User = require('../models/User');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// 모든 관리자 라우트는 관리자 권한 필요
router.use(adminMiddleware);

// 사용자 목록 조회 (페이지네이션 포함)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || '';

    // 검색 조건 구성
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    // 사용자 조회
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 전체 사용자 수
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('사용자 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 목록을 가져오는 중 오류가 발생했습니다.'
    });
  }
});

// 대시보드 통계
router.get('/dashboard/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    // 최근 7일간 가입한 사용자
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        adminUsers,
        regularUsers,
        recentUsers
      }
    });
  } catch (error) {
    console.error('통계 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '통계를 가져오는 중 오류가 발생했습니다.'
    });
  }
});

// 특정 사용자 상세 정보 조회
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('사용자 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보를 가져오는 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 정보 수정
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, phone, role, isActive } = req.body;

    // 자기 자신의 관리자 권한 해제 방지
    if (req.params.id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: '자신의 관리자 권한을 해제할 수 없습니다.'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    // 이메일 중복 확인 (본인 제외)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '이미 사용 중인 이메일입니다.'
        });
      }
    }

    // 업데이트할 필드만 적용
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: '사용자 정보가 업데이트되었습니다.',
      data: user
    });
  } catch (error) {
    console.error('사용자 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 수정 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 삭제
router.delete('/users/:id', async (req, res) => {
  try {
    // 자기 자신 삭제 방지
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '자기 자신을 삭제할 수 없습니다.'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '사용자가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('사용자 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 활성화/비활성화 토글
router.patch('/users/:id/toggle-active', async (req, res) => {
  try {
    // 자기 자신 비활성화 방지
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: '자기 자신을 비활성화할 수 없습니다.'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `사용자가 ${user.isActive ? '활성화' : '비활성화'}되었습니다.`,
      data: { isActive: user.isActive }
    });
  } catch (error) {
    console.error('사용자 활성화 토글 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 상태 변경 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 역할 변경
router.patch('/users/:id/change-role', async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: '유효하지 않은 역할입니다.'
      });
    }

    // 자기 자신의 관리자 권한 해제 방지
    if (req.params.id === req.user._id.toString() && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: '자신의 관리자 권한을 해제할 수 없습니다.'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: '사용자 역할이 변경되었습니다.',
      data: { role: user.role }
    });
  } catch (error) {
    console.error('역할 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '역할 변경 중 오류가 발생했습니다.'
    });
  }
});

// 최근 가입한 사용자 목록
router.get('/users/recent/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('최근 사용자 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '최근 사용자를 가져오는 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
