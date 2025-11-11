const mongoose = require('mongoose');

const AlarmSchema = new mongoose.Schema({ 
  minutesBefore: { type: Number, default: 10 } 
}, { _id: false });

const RecurrenceSchema = new mongoose.Schema({
  freq: { type: String, enum: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'], default: 'NONE' },
  rrule: { type: String, default: '' },
  exDates: [{ type: Date }]
}, { _id: false });

const EventSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // 기본 정보
  title: { type: String, required: true, index: 'text' },
  note: { type: String, default: '', index: 'text' },
  place: { type: String, default: '', index: 'text' },
  
  // 시간 정보
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  allDay: { type: Boolean, default: false },
  
  // 스타일링
  color: { type: String, default: '#2563eb' },
  
  // 분류
  category: { 
    type: String, 
    enum: ['work', 'personal', 'family', 'meeting', 'birthday', 'holiday', 'other'], 
    default: 'other',
    index: true
  },
  tags: [{ type: String, index: true }],
  
  // 반복 및 알람
  recurrence: RecurrenceSchema,
  alarms: [AlarmSchema],
  
  // 공유 기능
  isPublic: { type: Boolean, default: false },
  sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // 사진 연결
  photoIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }],
  
  // 완료 여부
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);