import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/admin/dashboard/stats');
      setStats(data.stats);
      setUsers(data.recentUsers);
    } catch (err) {
      console.error('대시보드 로드 실패:', err);
      alert(err.response?.data?.message || '권한이 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/api/admin/users', {
        params: { search: searchTerm }
      });
      setUsers(data.users);
    } catch (err) {
      console.error('사용자 목록 로드 실패:', err);
    }
  };

  const changeUserRole = async (userId, newRole) => {
    if (!confirm(`이 사용자를 ${newRole}(으)로 변경하시겠습니까?`)) return;
    
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      alert('역할이 변경되었습니다');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || '역할 변경 실패');
    }
  };

  const toggleUserStatus = async (userId, isActive) => {
    if (!confirm(`이 계정을 ${isActive ? '활성화' : '비활성화'}하시겠습니까?`)) return;
    
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { isActive });
      alert('계정 상태가 변경되었습니다');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || '상태 변경 실패');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('이 사용자와 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다!')) return;
    
    try {
      await api.delete(`/api/admin/users/${userId}`);
      alert('사용자가 삭제되었습니다');
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || '사용자 삭제 실패');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🔧 관리자 대시보드</h1>
        <p>시스템 전체를 관리할 수 있습니다</p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.users}</div>
              <div className="stat-label">전체 사용자</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📸</div>
            <div className="stat-content">
              <div className="stat-value">{stats.photos}</div>
              <div className="stat-label">전체 사진</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.events}</div>
              <div className="stat-label">전체 일정</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📁</div>
            <div className="stat-content">
              <div className="stat-value">{stats.albums}</div>
              <div className="stat-label">전체 앨범</div>
            </div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon">💾</div>
            <div className="stat-content">
              <div className="stat-value">{stats.storageUsedMB} MB</div>
              <div className="stat-label">저장공간 사용량</div>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 관리 */}
      <div className="section">
        <div className="section-header">
          <h2>사용자 관리</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="이메일이나 이름으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchUsers()}
            />
            <button onClick={fetchUsers} className="btn primary">검색</button>
          </div>
        </div>

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>이메일</th>
                <th>이름</th>
                <th>역할</th>
                <th>사진</th>
                <th>일정</th>
                <th>가입일</th>
                <th>상태</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.email}</td>
                  <td>{user.displayName || '-'}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.stats?.photoCount || 0}</td>
                  <td>{user.stats?.eventCount || 0}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => changeUserRole(user._id, user.role === 'admin' ? 'user' : 'admin')}
                        className="btn small"
                        title="역할 변경"
                      >
                        {user.role === 'admin' ? '👤' : '👑'}
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user._id, !user.isActive)}
                        className="btn small"
                        title={user.isActive ? '비활성화' : '활성화'}
                      >
                        {user.isActive ? '🔒' : '🔓'}
                      </button>
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="btn small danger"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}