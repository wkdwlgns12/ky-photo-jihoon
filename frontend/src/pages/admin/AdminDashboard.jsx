import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('통계 조회 오류:', error);
      setError('통계를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">로딩 중...</div></div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="form-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="mb-4">관리자 대시보드</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalUsers || 0}</div>
          <div className="stat-label">전체 사용자</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#28a745' }}>
            {stats?.activeUsers || 0}
          </div>
          <div className="stat-label">활성 사용자</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#6c757d' }}>
            {stats?.inactiveUsers || 0}
          </div>
          <div className="stat-label">비활성 사용자</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#dc3545' }}>
            {stats?.adminUsers || 0}
          </div>
          <div className="stat-label">관리자</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ffc107' }}>
            {stats?.regularUsers || 0}
          </div>
          <div className="stat-label">일반 사용자</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#17a2b8' }}>
            {stats?.recentUsers || 0}
          </div>
          <div className="stat-label">최근 7일 가입</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">시스템 개요</h2>
        <p>전체 사용자 수: <strong>{stats?.totalUsers}</strong>명</p>
        <p>활성 비율: <strong>{stats?.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%</strong></p>
        <p>관리자 비율: <strong>{stats?.totalUsers > 0 ? ((stats.adminUsers / stats.totalUsers) * 100).toFixed(1) : 0}%</strong></p>
      </div>

      <div className="flex gap-2 mt-3">
        <a href="/admin/users" className="btn btn-primary">
          사용자 관리로 이동
        </a>
      </div>
    </div>
  );
};

export default AdminDashboard;
