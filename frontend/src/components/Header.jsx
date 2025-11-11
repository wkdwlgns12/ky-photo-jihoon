import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header({ user, onLogout }) {
  return (
    <header className='header'>
      <Link to='/' className='logo'>
        <span className='logo-icon'>📸</span>
        <strong>KY Photo</strong>
      </Link>
      
      <nav className='nav'>
        {user ? (
          <>
            <Link className='nav-link' to='/dashboard'>
              🏠 대시보드
            </Link>
            <Link className='nav-link' to='/photos'>
              📷 사진
            </Link>
            <Link className='nav-link' to='/calendar'>
              📅 캘린더
            </Link>
            
            {user.role === 'admin' && (
              <Link className='nav-link admin' to='/admin'>
                🔧 관리자
              </Link>
            )}
            
            <div className='user-menu'>
              <span className='user-name'>
                {user.displayName || user.email}
              </span>
              <button className='btn logout' onClick={onLogout}>
                로그아웃
              </button>
            </div>
          </>
        ) : (
          <Link className='btn primary' to='/'>
            로그인
          </Link>
        )}
      </nav>
    </header>
  );
}