import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 요청 인터셉터: 토큰을 헤더에 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 오류 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 오류 시 토큰 제거 및 로그인 페이지로 리다이렉트
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authAPI = {
  // 회원가입
  register: (data) => api.post('/auth/register', data),

  // 로그인
  login: (data) => api.post('/auth/login', data),

  // 로그아웃
  logout: () => api.post('/auth/logout'),

  // 현재 사용자 정보
  me: () => api.get('/auth/me'),

  // 비밀번호 변경
  changePassword: (data) => api.put('/auth/change-password', data)
};

// 관리자 API
export const adminAPI = {
  // 대시보드 통계
  getStats: () => api.get('/admin/dashboard/stats'),

  // 사용자 목록 조회
  getUsers: (params) => api.get('/admin/users', { params }),

  // 특정 사용자 조회
  getUser: (id) => api.get(`/admin/users/${id}`),

  // 사용자 수정
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),

  // 사용자 삭제
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // 사용자 활성화/비활성화
  toggleUserActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),

  // 사용자 역할 변경
  changeUserRole: (id, role) => api.patch(`/admin/users/${id}/change-role`, { role }),

  // 최근 사용자 목록
  getRecentUsers: (limit) => api.get('/admin/users/recent/list', { params: { limit } })
};

export default api;
