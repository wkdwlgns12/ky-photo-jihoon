const authMiddleware = require('./auth');

// 관리자 권한 확인 미들웨어
const adminMiddleware = [
  authMiddleware,
  (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.'
      });
    }
    next();
  }
];

module.exports = adminMiddleware;
