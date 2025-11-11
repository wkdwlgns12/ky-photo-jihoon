import React, { useState, useEffect } from 'react';
import { adminAPI, scheduleAPI } from '../../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [scheduleStats, setScheduleStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [userResponse, scheduleResponse] = await Promise.all([
        adminAPI.getStats(),
        scheduleAPI.getStats()
      ]);
      setStats(userResponse.data.data);
      setScheduleStats(scheduleResponse.data.data);
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

      <h2 className="mb-3">📊 사용자 통계</h2>
      <div className="stats-grid mb-4">
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

      <h2 className="mb-3">📅 일정 통계</h2>
      <div className="stats-grid mb-4">
        <div className="stat-card">
          <div className="stat-value">{scheduleStats?.totalSchedules || 0}</div>
          <div className="stat-label">전체 일정</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#007bff' }}>
            {scheduleStats?.upcomingSchedules || 0}
          </div>
          <div className="stat-label">예정된 일정</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#28a745' }}>
            {scheduleStats?.completedSchedules || 0}
          </div>
          <div className="stat-label">완료된 일정</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#6c757d' }}>
            {scheduleStats?.cancelledSchedules || 0}
          </div>
          <div className="stat-label">취소된 일정</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ffc107' }}>
            {scheduleStats?.thisMonthSchedules || 0}
          </div>
          <div className="stat-label">이번 달 일정</div>
        </div>

        <div className="stat-card">
          <div className="stat-value" style={{ color: '#17a2b8' }}>
            {scheduleStats?.revenue?.total ? `${(scheduleStats.revenue.total / 10000).toFixed(0)}만원` : '0원'}
          </div>
          <div className="stat-label">총 수익 (완료)</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
          <h3 className="card-title">사용자 시스템 개요</h3>
          <p>전체 사용자 수: <strong>{stats?.totalUsers}</strong>명</p>
          <p>활성 비율: <strong>{stats?.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%</strong></p>
          <p>관리자 비율: <strong>{stats?.totalUsers > 0 ? ((stats.adminUsers / stats.totalUsers) * 100).toFixed(1) : 0}%</strong></p>
        </div>

        <div className="card" style={{ flex: 1, minWidth: '300px' }}>
          <h3 className="card-title">일정 타입별 분포</h3>
          {scheduleStats?.schedulesByType && scheduleStats.schedulesByType.length > 0 ? (
            scheduleStats.schedulesByType.map((item) => (
              <p key={item._id}>
                {item._id || '기타'}: <strong>{item.count}</strong>개
              </p>
            ))
          ) : (
            <p>데이터가 없습니다.</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <a href="/admin/users" className="btn btn-primary">
          사용자 관리
        </a>
        <a href="/schedules" className="btn btn-success">
          일정 관리
        </a>
      </div>
    </div>
  );
};

export default AdminDashboard;
