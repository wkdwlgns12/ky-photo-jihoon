import React, { useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import api from '../../api/client'
import EventFormModal from './EventFormModal'

export default function CalendarPage(){
  const ref = useRef(null)
  const [range, setRange] = useState({ from:null, to:null })
  const [events, setEvents] = useState([])
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(null)

  const load = async (from, to) => {
    if (!from || !to) return
    const qs = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() }).toString()
    const { data } = await api.get(`/api/events?${qs}`)
    const items = data.items || []
    const fcEvents = items.map(e => {
      if (e.recurrence && e.recurrence.freq !== 'NONE' && e.recurrence.rrule) {
        return { id: e._id, title: e.title, color: e.color, rrule: e.recurrence.rrule, exdate: (e.recurrence.exDates||[]).map(d=>new Date(d).toISOString()) }
      }
      return { id: e._id, title: e.title, start: e.occurrenceStart || e.startAt, end: e.occurrenceEnd || e.endAt, allDay: e.allDay, color: e.color }
    })
    setEvents(fcEvents)
  }

  const onDatesSet = (arg) => { const from=arg.start, to=arg.end; setRange({from,to}); load(from,to) }
  const onSelect = (sel) => {
    setDraft({ title:'', startAt: sel.start, endAt: sel.end, allDay: sel.allDay, color:'#2563eb', recurrence:{ freq:'NONE', rrule:'', exDates:[] }, alarms:[{minutesBefore:10}] })
    setOpen(true)
  }

  return (
    <div className="container">
      <div className="card">
        <FullCalendar
          ref={ref}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ start:'today prev,next', center:'title', end:'dayGridMonth,timeGridWeek,timeGridDay' }}
          events={events}
          selectable
          selectMirror
          select={onSelect}
          datesSet={onDatesSet}
          height="calc(100vh - 170px)"
        />
      </div>
      {open && <EventFormModal draft={draft} onClose={()=>setOpen(false)} onSaved={()=>{ setOpen(false); load(range.from, range.to) }} />}
    </div>
  )
}
