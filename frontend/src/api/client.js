import axios from 'axios';

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL, 
  withCredentials: true 
});

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  e => {
    if (e.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(e);
  }
);

export default api;