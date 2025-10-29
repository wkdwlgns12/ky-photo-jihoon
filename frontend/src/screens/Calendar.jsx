import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import api from '../api'

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [range, setRange] = useState({ start: null, end: null })
  const [modal, setModal] = useState({ open: false, initial: null })

  const fetchEvents = async (r) => {
    if (!r?.start || !r?.end) return
    const params = new URLSearchParams({ from: r.start.toISOString(), to: r.end.toISOString() })
    const { data } = await api.get('/events?' + params.toString())
    setEvents(data.map(ev => ({
      id: ev._id + (ev.isRecurring ? `@${new Date(ev.instanceStart).toISOString()}` : ''),
      title: ev.title,
      start: ev.instanceStart,
      end: ev.instanceEnd,
      allDay: ev.allDay,
      backgroundColor: ev.color,
      extendedProps: { raw: ev }
    })))
  }

  const onRangeChange = (arg) => setRange({ start: arg?.start, end: arg?.end })
  useEffect(() => { fetchEvents(range) }, [range.start?.toString(), range.end?.toString()])

  const onDateSelect = (sel) => {
    setModal({
      open: true,
      initial: { startAt: sel.startStr, endAt: sel.endStr, allDay: sel.allDay }
    })
  }
  const onEventClick = (info) => {
    const base = info.event.extendedProps.raw
    setModal({ open: true, initial: { ...base, _id: base._id } })
  }

  return (
    <div>
      <h2>Smart Scheduler</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
        initialView="dayGridMonth"
        selectable
        select={onDateSelect}
        eventClick={onEventClick}
        events={events}
        datesSet={onRangeChange}
        height="80vh"
      />
      {modal.open && (
        <EventModal
          initial={modal.initial}
          onClose={() => setModal({ open: false, initial: null })}
          onSaved={() => fetchEvents(range)}
          onDeleted={() => fetchEvents(range)}
        />
      )}
    </div>
  )
}

/* --- 로컬 모달 컴포넌트 (파일 분리 없이 사용) --- */
function EventModal({ initial, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({
    title: '',
    note: '',
    place: '',
    startAt: '',
    endAt: '',
    allDay: false,
    color: '#3788d8',
    tags: '',
    recurrenceRrule: ''
  })
  const [err, setErr] = useState('')

  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title || '',
        note: initial.note || '',
        place: initial.place || '',
        startAt: initial.startAt ? new Date(initial.startAt).toISOString().slice(0,16)
              : (initial.instanceStart ? new Date(initial.instanceStart).toISOString().slice(0,16) : ''),
        endAt: initial.endAt ? new Date(initial.endAt).toISOString().slice(0,16)
              : (initial.instanceEnd ? new Date(initial.instanceEnd).toISOString().slice(0,16) : ''),
        allDay: !!initial.allDay,
        color: initial.color || '#3788d8',
        tags: (initial.tags || []).join(','),
        recurrenceRrule: initial?.recurrence?.rrule || ''
      })
    }
  }, [initial])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const toPayload = () => ({
    title: form.title,
    note: form.note,
    place: form.place,
    startAt: new Date(form.startAt),
    endAt: new Date(form.endAt),
    allDay: form.allDay,
    color: form.color,
    tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
    recurrence: { rrule: form.recurrenceRrule.trim(), exDates: [] },
    alarms: []
  })

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      setErr('')
      if (initial?._id) await api.patch(`/events/${initial._id}`, toPayload())
      else await api.post('/events', toPayload())
      onSaved?.()
      onClose?.()
    } catch (e) {
      setErr(e?.response?.data?.message || '저장 실패')
    }
  }

  const onDelete = async () => {
    if (!initial?._id) return onClose?.()
    if (!confirm('이 일정을 삭제할까요?')) return
    await api.delete(`/events/${initial._id}`)
    onDeleted?.()
    onClose?.()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.25)', display: 'grid', placeItems: 'center' }}>
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, width: 420 }}>
        <h3>{initial?._id ? '일정 수정' : '일정 생성'}</h3>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8 }}>
          <input placeholder="제목" value={form.title} onChange={e=>set('title', e.target.value)} required />
          <textarea placeholder="메모" rows={3} value={form.note} onChange={e=>set('note', e.target.value)} />
          <input placeholder="장소" value={form.place} onChange={e=>set('place', e.target.value)} />
          <label>시작
            <input type="datetime-local" value={form.startAt} onChange={e=>set('startAt', e.target.value)} required />
          </label>
          <label>종료
            <input type="datetime-local" value={form.endAt} onChange={e=>set('endAt', e.target.value)} required />
          </label>
          <label>
            <input type="checkbox" checked={form.allDay} onChange={e=>set('allDay', e.target.checked)} /> 종일
          </label>
          <label>색상
            <input type="color" value={form.color} onChange={e=>set('color', e.target.value)} />
          </label>
          <input placeholder="태그(쉼표 구분)" value={form.tags} onChange={e=>set('tags', e.target.value)} />
          <input placeholder="RRULE (예: FREQ=WEEKLY;BYDAY=MO,WE)" value={form.recurrenceRrule} onChange={e=>set('recurrenceRrule', e.target.value)} />
          {err && <div style={{ color: 'crimson', fontSize: 12 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            {initial?._id && <button type="button" onClick={onDelete} style={{ color: 'crimson' }}>삭제</button>}
            <button type="button" onClick={onClose}>닫기</button>
            <button type="submit">저장</button>
          </div>
        </form>
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          RRULE 예: <code>FREQ=DAILY</code>, <code>FREQ=WEEKLY;BYDAY=MO,WE</code>, <code>FREQ=MONTHLY;BYMONTHDAY=15</code>
        </div>
      </div>
    </div>
  )
}
