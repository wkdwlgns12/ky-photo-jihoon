const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '일정 제목은 필수입니다.'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, '시작 날짜는 필수입니다.']
  },
  endDate: {
    type: Date,
    required: [true, '종료 날짜는 필수입니다.']
  },
  location: {
    type: String,
    trim: true
  },
  client: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  },
  photographer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['예정', '진행중', '완료', '취소'],
    default: '예정'
  },
  type: {
    type: String,
    enum: ['웨딩', '돌잔치', '프로필', '제품', '행사', '기타'],
    default: '기타'
  },
  price: {
    type: Number,
    min: 0
  },
  deposit: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 업데이트 시간 자동 갱신
scheduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 날짜 유효성 검증
scheduleSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('종료 날짜는 시작 날짜보다 빠를 수 없습니다.'));
  }
  next();
});

const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
