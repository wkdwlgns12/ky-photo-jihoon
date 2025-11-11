import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from './api/client'
import Header from './components/Header'
import ProtectRoute from './components/ProtectRoute'
import Landing from './pages/Landing'
import UserDashboard from './pages/user/UserDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'
import CalendarPage from './components/calendar/CalendarPage'

export default function App(){
  const [user, setUser] = useState(null)
  const isAuthed = !!user

  useEffect(()=>{ (async()=>{ try{ const {data}=await api.get('/api/auth/me'); setUser(data.user) }catch{} })() },[])

  const onLogout = ()=>{ localStorage.removeItem('token'); setUser(null) }

  return (
    <BrowserRouter>
      <Header user={user} onLogout={onLogout} />
      <Routes>
        <Route path='/' element={<Landing setUser={setUser} />} />
        <Route element={<ProtectRoute isAuthed={isAuthed} user={user} />}>
          <Route path='/user' element={<UserDashboard />} />
          <Route path='/calendar' element={<CalendarPage />} />
          <Route path='/admin' element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
