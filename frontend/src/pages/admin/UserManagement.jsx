import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminAPI.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        search: search,
        role: roleFilter
      });

      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleRoleFilter = (e) => {
    setRoleFilter(e.target.value);
    setPagination({ ...pagination, page: 1 });
  };

  const handleToggleActive = async (userId) => {
    if (!window.confirm('사용자의 활성화 상태를 변경하시겠습니까?')) {
      return;
    }

    try {
      await adminAPI.toggleUserActive(userId);
      fetchUsers();
    } catch (error) {
      console.error('활성화 토글 오류:', error);
      alert(error.response?.data?.message || '상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleChangeRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';

    if (!window.confirm(`사용자 역할을 ${newRole === 'admin' ? '관리자' : '일반 사용자'}로 변경하시겠습니까?`)) {
      return;
    }

    try {
      await adminAPI.changeUserRole(userId, newRole);
      fetchUsers();
    } catch (error) {
      console.error('역할 변경 오류:', error);
      alert(error.response?.data?.message || '역할 변경 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`정말로 "${userName}" 사용자를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      fetchUsers();
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      alert(error.response?.data?.message || '사용자 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    try {
      await adminAPI.updateUser(editingUser._id, {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        isActive: editingUser.isActive
      });

      setShowEditModal(false);
      setEditingUser(null);
      fetchUsers();
      alert('사용자 정보가 업데이트되었습니다.');
    } catch (error) {
      console.error('사용자 수정 오류:', error);
      alert(error.response?.data?.message || '사용자 수정 중 오류가 발생했습니다.');
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="mb-4">사용자 관리</h1>

      {error && <div className="form-error mb-3">{error}</div>}

      {/* 검색 및 필터 */}
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="이름 또는 이메일로 검색..."
          value={search}
          onChange={handleSearch}
        />
        <select
          className="form-input"
          value={roleFilter}
          onChange={handleRoleFilter}
          style={{ width: 'auto' }}
        >
          <option value="">모든 역할</option>
          <option value="admin">관리자</option>
          <option value="user">일반 사용자</option>
        </select>
        <button onClick={fetchUsers} className="btn btn-secondary">
          새로고침
        </button>
      </div>

      {/* 사용자 테이블 */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>전화번호</th>
              <th>역할</th>
              <th>상태</th>
              <th>가입일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>
                  <span
                    className={user.role === 'admin' ? 'badge badge-admin' : 'badge badge-user'}
                  >
                    {user.role === 'admin' ? '관리자' : '사용자'}
                  </span>
                </td>
                <td>
                  <span
                    className={user.isActive ? 'badge badge-active' : 'badge badge-inactive'}
                  >
                    {user.isActive ? '활성' : '비활성'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</td>
                <td>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="btn btn-primary btn-sm"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleToggleActive(user._id)}
                      className="btn btn-warning btn-sm"
                    >
                      {user.isActive ? '비활성화' : '활성화'}
                    </button>
                    <button
                      onClick={() => handleChangeRole(user._id, user.role)}
                      className="btn btn-secondary btn-sm"
                    >
                      역할 변경
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id, user.name)}
                      className="btn btn-danger btn-sm"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="pagination">
        <button
          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
          disabled={pagination.page === 1}
        >
          이전
        </button>
        <span>
          {pagination.page} / {pagination.totalPages}
        </span>
        <button
          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
          disabled={pagination.page === pagination.totalPages}
        >
          다음
        </button>
        <span style={{ marginLeft: '1rem' }}>
          전체 {pagination.total}명
        </span>
      </div>

      {/* 수정 모달 */}
      {showEditModal && editingUser && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="form-container"
            style={{ maxWidth: '500px', margin: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="form-title">사용자 수정</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label className="form-label">이름</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">이메일</label>
                <input
                  type="email"
                  className="form-input"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">전화번호</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editingUser.phone || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">역할</label>
                <select
                  className="form-input"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="user">일반 사용자</option>
                  <option value="admin">관리자</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={editingUser.isActive}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, isActive: e.target.checked })
                    }
                  />
                  {' '}활성 상태
                </label>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  저장
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
