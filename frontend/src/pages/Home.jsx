import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>KY Photo 관리 시스템</h1>
        <p style={{ fontSize: '1.5rem', color: '#666', marginBottom: '2rem' }}>
          사진 및 회원 관리를 위한 통합 솔루션
        </p>

        {user ? (
          <div>
            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
              환영합니다, <strong>{user.name}</strong>님!
            </p>
            <div className="flex" style={{ justifyContent: 'center', gap: '1rem' }}>
              <Link to="/dashboard" className="btn btn-primary">
                대시보드로 이동
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-secondary">
                  관리자 페이지
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="flex" style={{ justifyContent: 'center', gap: '1rem' }}>
            <Link to="/login" className="btn btn-primary">
              로그인
            </Link>
            <Link to="/register" className="btn btn-secondary">
              회원가입
            </Link>
          </div>
        )}

        <div className="stats-grid" style={{ marginTop: '4rem' }}>
          <div className="card">
            <h3>회원 관리</h3>
            <p>사용자 계정 및 권한 관리</p>
          </div>
          <div className="card">
            <h3>보안</h3>
            <p>JWT 기반 인증 시스템</p>
          </div>
          <div className="card">
            <h3>관리자 기능</h3>
            <p>통계 및 사용자 관리 대시보드</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
