import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { scheduleAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const ScheduleDetail = ({ mode = 'view' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    client: {
      name: '',
      phone: '',
      email: ''
    },
    type: '기타',
    status: '예정',
    price: '',
    deposit: '',
    notes: ''
  });

  useEffect(() => {
    // URL 파라미터에서 날짜 가져오기 (새 일정 생성 시)
    const dateParam = searchParams.get('date');
    if (mode === 'new' && dateParam) {
      const date = new Date(dateParam);
      setFormData(prev => ({
        ...prev,
        startDate: date.toISOString().slice(0, 16),
        endDate: date.toISOString().slice(0, 16)
      }));
    }

    if (mode !== 'new' && id) {
      fetchSchedule();
    }
  }, [id, mode]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await scheduleAPI.getById(id);
      const schedule = response.data.data;

      setFormData({
        title: schedule.title,
        description: schedule.description || '',
        startDate: new Date(schedule.startDate).toISOString().slice(0, 16),
        endDate: new Date(schedule.endDate).toISOString().slice(0, 16),
        location: schedule.location || '',
        client: schedule.client || { name: '', phone: '', email: '' },
        type: schedule.type,
        status: schedule.status,
        price: schedule.price || '',
        deposit: schedule.deposit || '',
        notes: schedule.notes || ''
      });
    } catch (error) {
      console.error('일정 조회 오류:', error);
      setError('일정을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('client.')) {
      const clientField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        client: {
          ...prev.client,
          [clientField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.startDate || !formData.endDate) {
      setError('제목, 시작 날짜, 종료 날짜는 필수입니다.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'new') {
        await scheduleAPI.create(formData);
        alert('일정이 생성되었습니다.');
      } else {
        await scheduleAPI.update(id, formData);
        alert('일정이 수정되었습니다.');
      }
      navigate('/schedules');
    } catch (error) {
      console.error('일정 저장 오류:', error);
      setError(error.response?.data?.message || '일정 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 일정을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await scheduleAPI.delete(id);
      alert('일정이 삭제되었습니다.');
      navigate('/schedules');
    } catch (error) {
      console.error('일정 삭제 오류:', error);
      alert(error.response?.data?.message || '일정 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading && mode !== 'new') {
    return (
      <div className="container">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex-between mb-3">
        <h1>
          {mode === 'new' ? '새 일정 추가' : mode === 'edit' ? '일정 수정' : '일정 상세'}
        </h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/schedules')} className="btn btn-secondary">
            목록으로
          </button>
          {mode === 'view' && (
            <>
              <button onClick={() => navigate(`/schedules/${id}/edit`)} className="btn btn-primary">
                수정
              </button>
              <button onClick={handleDelete} className="btn btn-danger">
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      {error && <div className="form-error mb-3">{error}</div>}

      {mode === 'view' ? (
        <div className="card">
          <div className="schedule-details">
            <div className="detail-row">
              <label>제목:</label>
              <div>{formData.title}</div>
            </div>
            <div className="detail-row">
              <label>타입:</label>
              <div>{formData.type}</div>
            </div>
            <div className="detail-row">
              <label>상태:</label>
              <div>
                <span className={`badge badge-${formData.status}`}>
                  {formData.status}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <label>시작 날짜:</label>
              <div>{new Date(formData.startDate).toLocaleString('ko-KR')}</div>
            </div>
            <div className="detail-row">
              <label>종료 날짜:</label>
              <div>{new Date(formData.endDate).toLocaleString('ko-KR')}</div>
            </div>
            <div className="detail-row">
              <label>장소:</label>
              <div>{formData.location || '-'}</div>
            </div>
            <div className="detail-row">
              <label>고객명:</label>
              <div>{formData.client.name || '-'}</div>
            </div>
            <div className="detail-row">
              <label>고객 전화번호:</label>
              <div>{formData.client.phone || '-'}</div>
            </div>
            <div className="detail-row">
              <label>고객 이메일:</label>
              <div>{formData.client.email || '-'}</div>
            </div>
            <div className="detail-row">
              <label>금액:</label>
              <div>{formData.price ? `${formData.price.toLocaleString()}원` : '-'}</div>
            </div>
            <div className="detail-row">
              <label>계약금:</label>
              <div>{formData.deposit ? `${formData.deposit.toLocaleString()}원` : '-'}</div>
            </div>
            {formData.description && (
              <div className="detail-row">
                <label>설명:</label>
                <div>{formData.description}</div>
              </div>
            )}
            {formData.notes && (
              <div className="detail-row">
                <label>메모:</label>
                <div style={{ whiteSpace: 'pre-wrap' }}>{formData.notes}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form-container" style={{ maxWidth: '800px' }}>
          <div className="form-group">
            <label className="form-label">제목 *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">타입 *</label>
              <select
                name="type"
                className="form-input"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="웨딩">웨딩</option>
                <option value="돌잔치">돌잔치</option>
                <option value="프로필">프로필</option>
                <option value="제품">제품</option>
                <option value="행사">행사</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">상태 *</label>
              <select
                name="status"
                className="form-input"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="예정">예정</option>
                <option value="진행중">진행중</option>
                <option value="완료">완료</option>
                <option value="취소">취소</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">시작 날짜 *</label>
              <input
                type="datetime-local"
                name="startDate"
                className="form-input"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">종료 날짜 *</label>
              <input
                type="datetime-local"
                name="endDate"
                className="form-input"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">장소</label>
            <input
              type="text"
              name="location"
              className="form-input"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <h3 className="mt-3 mb-2">고객 정보</h3>

          <div className="form-group">
            <label className="form-label">고객명</label>
            <input
              type="text"
              name="client.name"
              className="form-input"
              value={formData.client.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">고객 전화번호</label>
              <input
                type="tel"
                name="client.phone"
                className="form-input"
                value={formData.client.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">고객 이메일</label>
              <input
                type="email"
                name="client.email"
                className="form-input"
                value={formData.client.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <h3 className="mt-3 mb-2">금액 정보</h3>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">금액</label>
              <input
                type="number"
                name="price"
                className="form-input"
                value={formData.price}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">계약금</label>
              <input
                type="number"
                name="deposit"
                className="form-input"
                value={formData.deposit}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">설명</label>
            <textarea
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label className="form-label">메모</label>
            <textarea
              name="notes"
              className="form-input"
              value={formData.notes}
              onChange={handleChange}
              rows="5"
            />
          </div>

          <div className="flex gap-2 mt-3">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '저장 중...' : mode === 'new' ? '생성' : '수정'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/schedules')}
              className="btn btn-secondary"
            >
              취소
            </button>
          </div>
        </form>
      )}

      <style jsx>{`
        .schedule-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .detail-row {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 1rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid #eee;
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-row label {
          font-weight: 600;
          color: #333;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .badge-예정 {
          background-color: #007bff;
          color: white;
        }

        .badge-진행중 {
          background-color: #ffc107;
          color: #212529;
        }

        .badge-완료 {
          background-color: #28a745;
          color: white;
        }

        .badge-취소 {
          background-color: #6c757d;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default ScheduleDetail;
