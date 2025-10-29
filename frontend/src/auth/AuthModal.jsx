import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function AuthModal() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [remember, setRemember] = useState(true)
  const { login, register } = useAuth()
  const [err, setErr] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      setErr('')
      if (mode === 'login') await login(email, password, remember)
      else await register(email, password, name)
      setOpen(false)
    } catch (e) {
      setErr(e?.response?.data?.message || '실패했습니다')
    }
  }

  if (!open) return <button onClick={() => setOpen(true)}>Login / Register</button>

  return (
    <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
      <h3>{mode === 'login' ? '로그인' : '회원가입'}</h3>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, width: 260 }}>
        {mode === 'register' && (
          <input placeholder="이름" value={name} onChange={e => setName(e.target.value)} />
        )}
        <input placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="비밀번호" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {mode === 'login' && (
          <label style={{ fontSize: 12 }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> 기억하기
          </label>
        )}
        {err && <div style={{ color: 'crimson', fontSize: 12 }}>{err}</div>}
        <button type="submit">{mode === 'login' ? '로그인' : '가입'}</button>
      </form>
      <div style={{ marginTop: 8 }}>
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? '회원가입으로' : '로그인으로'}
        </button>
        <button onClick={() => setOpen(false)} style={{ marginLeft: 8 }}>닫기</button>
      </div>
    </div>
  )
}
