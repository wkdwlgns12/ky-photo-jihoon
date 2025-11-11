import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          KY Photo
        </Link>

        <div className="navbar-menu">
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-link">
                대시보드
              </Link>
              <Link to="/schedules" className="navbar-link">
                일정 관리
              </Link>
              {isAdmin() && (
                <>
                  <Link to="/admin" className="navbar-link">
                    관리자
                  </Link>
                  <Link to="/admin/users" className="navbar-link">
                    사용자 관리
                  </Link>
                </>
              )}
              <span className="navbar-link">
                {user.name}님 ({user.role})
              </span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                로그인
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
