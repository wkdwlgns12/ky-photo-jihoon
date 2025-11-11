const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors({ 
  origin: process.env.FRONT_ORIGIN || "http://localhost:5173", 
  credentials: true 
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => console.error("❌ MongoDB 연결 실패:", err.message));

// 기본 라우트
app.get("/", (_req, res) => {
  res.json({ 
    message: "KY Photo API", 
    version: "2.0.0",
    endpoints: {
      auth: "/api/auth",
      events: "/api/events",
      photos: "/api/photos",
      albums: "/api/albums",
      admin: "/api/admin"
    }
  });
});

// API 라우트
app.use("/api/auth", require("./routes/authroutes"));
app.use("/api/events", require("./routes/event"));
app.use("/api/photos", require("./routes/photo"));
app.use("/api/albums", require("./routes/album"));
app.use("/api/admin", require("./routes/admin"));

// 404 처리
app.use((req, res) => {
  res.status(404).json({ 
    message: "Not Found",
    path: req.path,
    method: req.method
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error("❌ 에러:", err);
  
  // Multer 에러
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: '파일 크기가 너무 큽니다 (최대 10MB)' });
  }
  
  // Mongoose 에러
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: '입력값이 올바르지 않습니다', 
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ message: '잘못된 ID 형식입니다' });
  }
  
  res.status(err.status || 500).json({ 
    message: err.message || "서버 오류",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호 받음. 서버 종료 중...');
  mongoose.connection.close(() => {
    console.log('MongoDB 연결 종료');
    process.exit(0);
  });
});