const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 토큰 검증 미들웨어
const authMiddleware = async (req, res, next) => {
  try {
    // 토큰 가져오기 (헤더 또는 쿠키에서)
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '인증 토큰이 없습니다. 로그인이 필요합니다.'
      });
    }

    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // 사용자 조회
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: '비활성화된 계정입니다.'
      });
    }

    // 사용자 정보를 요청 객체에 추가
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다. 다시 로그인해주세요.'
      });
    }

    return res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.'
    });
  }
};

module.exports = authMiddleware;
