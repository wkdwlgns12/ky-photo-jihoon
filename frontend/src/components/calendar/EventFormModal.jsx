import React, { useState } from 'react'
import api from '../../api/client'

export default function EventFormModal({ draft, onClose, onSaved }){
  const [form, setForm] = useState(()=>({
    title: draft?.title || '',
    note: draft?.note || '',
    place: draft?.place || '',
    startAt: draft?.startAt || new Date(),
    endAt: draft?.endAt || new Date(Date.now()+60*60*1000),
    allDay: draft?.allDay || false,
    color: draft?.color || '#2563eb',
    recurrence: draft?.recurrence || { freq:'NONE', rrule:'', exDates: [] },
    alarms: draft?.alarms || [{ minutesBefore: 10 }],
  }))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const change = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type==='checkbox' ? checked : value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try{
      const payload = { ...form }
      payload.startAt = new Date(payload.startAt).toISOString()
      payload.endAt = new Date(payload.endAt).toISOString()
      await api.post('/api/events', payload)
      onSaved()
    }catch(err){
      setError(err.response?.data?.message || err.message)
    }finally{ setLoading(false) }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3 style={{marginTop:0}}>일정 만들기</h3>
        <form onSubmit={submit} style={{display:'grid', gap:8}}>
          <input name="title" className="input" placeholder="제목" value={form.title} onChange={change} required />
          <input name="place" className="input" placeholder="장소" value={form.place} onChange={change} />
          <textarea name="note" placeholder="메모" value={form.note} onChange={change} />
          <div className="row">
            <label>시작
              <input name="startAt" type="datetime-local" className="input" value={new Date(form.startAt).toISOString().slice(0,16)} onChange={change} />
            </label>
            <label>종료
              <input name="endAt" type="datetime-local" className="input" value={new Date(form.endAt).toISOString().slice(0,16)} onChange={change} />
            </label>
          </div>
          <label><input type="checkbox" name="allDay" checked={form.allDay} onChange={change} /> 종일</label>
          <label>색상
            <input name="color" type="color" className="input" value={form.color} onChange={change} />
          </label>
          <label>반복 (RRULE)
            <input name="rrule" className="input" placeholder="예: FREQ=WEEKLY;BYDAY=MO,WE" value={form.recurrence?.rrule||''}
              onChange={(e)=>setForm(prev=>({...prev, recurrence:{...prev.recurrence, rrule:e.target.value, freq: e.target.value? 'CUSTOM':'NONE' }}))} />
            <small className="mute">예) 매주 월/수: FREQ=WEEKLY;BYDAY=MO,WE</small>
          </label>
          {error && <div style={{color:'red'}}>{error}</div>}
          <div style={{display:'flex',gap:8}}>
            <button className="btn primary" disabled={loading}>{loading?'저장 중...':'저장'}</button>
            <button type="button" className="btn" onClick={onClose}>닫기</button>
          </div>
        </form>
      </div>
    </div>
  )
}
