import React, { useState } from 'react'
import api from '../api/client'
export default function AuthModal({ onClose, onAuthed }){
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email:'', password:'', displayName:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const change = e => setForm(prev=>({...prev, [e.target.name]: e.target.value}))
  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError('')
    try{
      if (mode==='login'){
        const {data} = await api.post('/api/auth/login', { email: form.email, password: form.password })
        localStorage.setItem('token', data.token)
        onAuthed(data.user)
      } else {
        await api.post('/api/auth/register', { email: form.email, password: form.password, displayName: form.displayName })
        const {data} = await api.post('/api/auth/login', { email: form.email, password: form.password })
        localStorage.setItem('token', data.token)
        onAuthed(data.user)
      }
      onClose()
    }catch(err){
      setError(err.response?.data?.message || err.message)
    }finally{ setLoading(false) }
  }
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3 style={{marginTop:0}}>{mode==='login'?'로그인':'회원가입'}</h3>
        <form onSubmit={submit} style={{display:'grid',gap:8}}>
          {mode==='register' && (
            <input name='displayName' className="input" placeholder='닉네임' value={form.displayName} onChange={change} required />
          )}
          <input name='email' type='email' className="input" placeholder='이메일' value={form.email} onChange={change} required />
          <input name='password' type='password' className="input" placeholder='비밀번호' value={form.password} onChange={change} required />
          {error && <div style={{color:'red',fontSize:12}}>{error}</div>}
          <button className="btn primary" disabled={loading}>{loading?'처리중...': (mode==='login'?'로그인':'회원가입')}</button>
        </form>
        <div style={{marginTop:8,fontSize:12,display:'flex',justifyContent:'space-between'}}>
          {mode==='login' ? (
            <button className="btn" onClick={()=>setMode('register')}>회원가입으로</button>
          ) : (
            <button className="btn" onClick={()=>setMode('login')}>로그인으로</button>
          )}
          <button className="btn" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}
