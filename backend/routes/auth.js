const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// JWT 토큰 생성 함수
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 회원가입
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // 필수 필드 검증
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '이메일, 비밀번호, 이름은 필수 항목입니다.'
      });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '이미 가입된 이메일입니다.'
      });
    }

    // 비밀번호 길이 검증
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '비밀번호는 최소 6자 이상이어야 합니다.'
      });
    }

    // 사용자 생성
    const user = new User({
      email,
      password,
      name,
      phone,
      role: 'user'
    });

    await user.save();

    // JWT 토큰 생성
    const token = generateToken(user._id);

    // 쿠키에 토큰 저장
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요.'
      });
    }

    // 사용자 조회
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.'
      });
    }

    // 계정 활성화 상태 확인
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '비활성화된 계정입니다. 관리자에게 문의하세요.'
      });
    }

    // JWT 토큰 생성
    const token = generateToken(user._id);

    // 쿠키에 토큰 저장
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7일
    });

    res.json({
      success: true,
      message: '로그인에 성공했습니다.',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: '로그아웃되었습니다.'
  });
});

// 현재 사용자 정보 조회
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보를 가져오는 중 오류가 발생했습니다.'
    });
  }
});

// 비밀번호 변경
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '현재 비밀번호와 새 비밀번호를 입력해주세요.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '새 비밀번호는 최소 6자 이상이어야 합니다.'
      });
    }

    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '현재 비밀번호가 올바르지 않습니다.'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '비밀번호가 변경되었습니다.'
    });
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '비밀번호 변경 중 오류가 발생했습니다.'
    });
  }
});

module.exports = router;
