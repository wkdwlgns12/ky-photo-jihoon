import React, { useEffect, useState } from 'react'
import api from '../api/client'
import AuthModal from '../components/AuthModal'
import { Link } from 'react-router-dom'
export default function Landing({ setUser }){
  const [open, setOpen] = useState(false)
  useEffect(()=>{ (async()=>{ try{ const {data} = await api.get('/api/auth/me'); setUser(data.user) }catch{} })() },[setUser])
  return (
    <div className='container'>
      <div className='card'>
        <h2>스마트 스케줄러 (MVP)</h2>
        <p>로그인 후 캘린더에서 일정을 생성/조회할 수 있습니다.</p>
        <div style={{display:'flex',gap:8}}>
          <button className='btn primary' onClick={()=>setOpen(true)}>로그인 / 회원가입</button>
          <Link className='btn' to='/calendar'>캘린더로 이동</Link>
        </div>
      </div>
      {open && <AuthModal onClose={()=>setOpen(false)} onAuthed={setUser} />}
    </div>
  )
}
