import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from './api/client';
import Header from './components/Header';
import ProtectRoute from './components/ProtectRoute';
import Landing from './pages/Landing';
import UserDashboard from './pages/user/UserDashboard';
import PhotoGallery from './pages/user/PhotoGallery';
import AdminDashboard from './pages/admin/AdminDashboard';
import CalendarPage from './components/calendar/CalendarPage';

export default function App() {
  const [user, setUser] = useState(null);
  const isAuthed = !!user;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/auth/me');
        setUser(data.user);
      } catch (err) {
        console.log('인증되지 않은 사용자');
      }
    })();
  }, []);

  const onLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Header user={user} onLogout={onLogout} />
      <Routes>
        <Route path='/' element={<Landing setUser={setUser} />} />
        
        {/* 사용자 라우트 */}
        <Route element={<ProtectRoute isAuthed={isAuthed} user={user} />}>
          <Route path='/dashboard' element={<UserDashboard />} />
          <Route path='/photos' element={<PhotoGallery />} />
          <Route path='/calendar' element={<CalendarPage />} />
        </Route>
        
        {/* 관리자 라우트 */}
        <Route element={<ProtectRoute isAuthed={isAuthed} user={user} requiredRole='admin' />}>
          <Route path='/admin' element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}