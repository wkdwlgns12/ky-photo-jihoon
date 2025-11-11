import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container">
      <h1 className="mb-4">대시보드</h1>

      <div className="card">
        <h2 className="card-title">사용자 정보</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem' }}>
          <div><strong>이름:</strong></div>
          <div>{user?.name}</div>

          <div><strong>이메일:</strong></div>
          <div>{user?.email}</div>

          <div><strong>전화번호:</strong></div>
          <div>{user?.phone || '미등록'}</div>

          <div><strong>역할:</strong></div>
          <div>
            <span className={user?.role === 'admin' ? 'badge badge-admin' : 'badge badge-user'}>
              {user?.role === 'admin' ? '관리자' : '일반 사용자'}
            </span>
          </div>

          <div><strong>계정 상태:</strong></div>
          <div>
            <span className={user?.isActive ? 'badge badge-active' : 'badge badge-inactive'}>
              {user?.isActive ? '활성' : '비활성'}
            </span>
          </div>

          <div><strong>가입일:</strong></div>
          <div>{new Date(user?.createdAt).toLocaleDateString('ko-KR')}</div>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="card">
          <h2 className="card-title">관리자 메뉴</h2>
          <p>관리자 권한이 있습니다. 상단 메뉴에서 관리자 페이지에 접근할 수 있습니다.</p>
          <div className="flex gap-2 mt-3">
            <a href="/admin" className="btn btn-primary">
              관리자 대시보드
            </a>
            <a href="/admin/users" className="btn btn-secondary">
              사용자 관리
            </a>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">환영합니다!</h2>
        <p>KY Photo 관리 시스템에 오신 것을 환영합니다.</p>
        <p>이 대시보드에서 회원 정보를 확인하실 수 있습니다.</p>
      </div>
    </div>
  );
};

export default Dashboard;
