import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scheduleAPI } from '../utils/api';
import Calendar from '../components/Calendar';

const Schedules = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('calendar'); // 'calendar' or 'list'
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    page: 1,
    limit: 10
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    if (view === 'list') {
      fetchSchedules();
    }
  }, [view, filters]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await scheduleAPI.getAll(filters);
      setSchedules(response.data.data.schedules);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('일정 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleDateClick = (date) => {
    navigate(`/schedules/new?date=${date.toISOString()}`);
  };

  const handleEventClick = (schedule) => {
    navigate(`/schedules/${schedule._id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말로 이 일정을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await scheduleAPI.delete(id);
      fetchSchedules();
    } catch (error) {
      console.error('일정 삭제 오류:', error);
      alert(error.response?.data?.message || '일정 삭제 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case '예정': return 'badge-primary';
      case '진행중': return 'badge-warning';
      case '완료': return 'badge-success';
      case '취소': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <h1>일정 관리</h1>
        <button onClick={() => navigate('/schedules/new')} className="btn btn-primary">
          + 새 일정 추가
        </button>
      </div>

      <div className="flex-between mb-3">
        <div className="btn-group">
          <button
            onClick={() => setView('calendar')}
            className={`btn ${view === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
          >
            캘린더
          </button>
          <button
            onClick={() => setView('list')}
            className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            목록
          </button>
        </div>

        {view === 'list' && (
          <div className="flex gap-2">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="form-input"
            >
              <option value="">모든 상태</option>
              <option value="예정">예정</option>
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
              <option value="취소">취소</option>
            </select>

            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="form-input"
            >
              <option value="">모든 타입</option>
              <option value="웨딩">웨딩</option>
              <option value="돌잔치">돌잔치</option>
              <option value="프로필">프로필</option>
              <option value="제품">제품</option>
              <option value="행사">행사</option>
              <option value="기타">기타</option>
            </select>
          </div>
        )}
      </div>

      {view === 'calendar' ? (
        <Calendar onDateClick={handleDateClick} onEventClick={handleEventClick} />
      ) : loading ? (
        <div className="loading">로딩 중...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>타입</th>
                  <th>날짜</th>
                  <th>장소</th>
                  <th>고객</th>
                  <th>상태</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      일정이 없습니다.
                    </td>
                  </tr>
                ) : (
                  schedules.map((schedule) => (
                    <tr key={schedule._id}>
                      <td>
                        <strong>{schedule.title}</strong>
                      </td>
                      <td>{schedule.type}</td>
                      <td>
                        {new Date(schedule.startDate).toLocaleDateString('ko-KR')}
                        {schedule.startDate !== schedule.endDate && (
                          <> ~ {new Date(schedule.endDate).toLocaleDateString('ko-KR')}</>
                        )}
                      </td>
                      <td>{schedule.location || '-'}</td>
                      <td>{schedule.client?.name || '-'}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            onClick={() => navigate(`/schedules/${schedule._id}`)}
                            className="btn btn-primary btn-sm"
                          >
                            상세
                          </button>
                          <button
                            onClick={() => navigate(`/schedules/${schedule._id}/edit`)}
                            className="btn btn-secondary btn-sm"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDelete(schedule._id)}
                            className="btn btn-danger btn-sm"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {schedules.length > 0 && (
            <div className="pagination">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
              >
                이전
              </button>
              <span>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === pagination.totalPages}
              >
                다음
              </button>
              <span style={{ marginLeft: '1rem' }}>
                전체 {pagination.total}개
              </span>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .btn-group {
          display: flex;
          gap: 0;
        }

        .btn-group button {
          border-radius: 0;
        }

        .btn-group button:first-child {
          border-top-left-radius: 4px;
          border-bottom-left-radius: 4px;
        }

        .btn-group button:last-child {
          border-top-right-radius: 4px;
          border-bottom-right-radius: 4px;
        }

        .badge-primary {
          background-color: #007bff;
          color: white;
        }

        .badge-secondary {
          background-color: #6c757d;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default Schedules;
