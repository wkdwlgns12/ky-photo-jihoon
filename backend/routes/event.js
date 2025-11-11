const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const Event = require('../models/Event');
const { rrulestr } = require('rrule');

function expandOccurrences(evt, fromISO, toISO) {
  const from = new Date(fromISO), to = new Date(toISO);
  if (!evt.recurrence || evt.recurrence.freq === 'NONE' || !evt.recurrence.rrule) {
    if (evt.startAt < to && evt.endAt > from) {
      return [{ ...evt, occurrenceStart: evt.startAt, occurrenceEnd: evt.endAt }];
    }
    return [];
  }
  const rule = rrulestr(evt.recurrence.rrule);
  const dates = rule.between(from, to, true);
  const exdates = new Set((evt.recurrence.exDates || []).map(d => new Date(d).toISOString()));
  const dur = new Date(evt.endAt) - new Date(evt.startAt);
  return dates
    .filter(d => !exdates.has(d.toISOString()))
    .map(d => ({ ...evt, occurrenceStart: d, occurrenceEnd: new Date(d.getTime() + dur) }));
}

// GET /api/events?from&to&q&tags
router.get('/', auth, async (req, res) => {
  try {
    const { from, to, q, tags } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: 'from, to query is required (ISO)' });
    }
    
    const filter = { ownerId: req.user._id };
    if (q) filter.$text = { $search: q };
    if (tags) filter.tags = { $in: String(tags).split(',') };
    
    const docs = await Event.find(filter).lean();
    const expanded = docs.flatMap(doc => expandOccurrences(doc, from, to));
    
    res.json({ items: expanded });
  } catch(e) {
    res.status(500).json({ message: 'Failed to list events', error: e.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const payload = { ...req.body, ownerId: req.user._id };
    const doc = await Event.create(payload);
    res.status(201).json({ item: doc });
  } catch(e) {
    res.status(500).json({ message: 'Failed to create event', error: e.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Event.findOneAndUpdate(
      { _id: id, ownerId: req.user._id },
      req.body,
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ item: doc });
  } catch(e) {
    res.status(500).json({ message: 'Failed to update event', error: e.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Event.findOneAndDelete({ _id: id, ownerId: req.user._id });
    if (!doc) return res.status(404).json({ message: 'Not found' });
    res.json({ ok: true });
  } catch(e) {
    res.status(500).json({ message: 'Failed to delete event', error: e.message });
  }
});

module.exports = router;