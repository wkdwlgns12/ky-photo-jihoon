import React from 'react'
import { Link } from 'react-router-dom'
export default function Header({ user, onLogout }){
  return (
    <header className='header'>
      <strong>KY Photo</strong>
      <nav style={{display:'flex',gap:8,alignItems:'center'}}>
        <Link className='btn' to='/'>홈</Link>
        <Link className='btn' to='/calendar'>캘린더</Link>
        {user ? (<>
          <span style={{fontSize:12}}>{user.displayName || user.email}</span>
          <button className='btn' onClick={onLogout}>로그아웃</button>
        </>) : <span className='btn'>로그인 필요</span>}
      </nav>
    </header>
  )
}
