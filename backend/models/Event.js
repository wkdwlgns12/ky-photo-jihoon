const mongoose = require('mongoose');
const AlarmSchema = new mongoose.Schema({ minutesBefore: { type: Number, default: 10 } }, { _id:false });
const RecurrenceSchema = new mongoose.Schema({
  freq: { type: String, enum:['NONE','DAILY','WEEKLY','MONTHLY','YEARLY','CUSTOM'], default:'NONE' },
  rrule: { type: String, default: '' },
  exDates: [{ type: Date }]
}, { _id:false });
const EventSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  title: { type: String, required: true, index: 'text' },
  note:  { type: String, default: '', index: 'text' },
  place: { type: String, default: '', index: 'text' },
  startAt: { type: Date, required: true },
  endAt:   { type: Date, required: true },
  allDay:  { type: Boolean, default: false },
  color:   { type: String, default: '#2563eb' },
  tags:    [{ type: String, index: true }],
  recurrence: RecurrenceSchema,
  alarms: [AlarmSchema]
}, { timestamps: true });
module.exports = mongoose.model('Event', EventSchema);
