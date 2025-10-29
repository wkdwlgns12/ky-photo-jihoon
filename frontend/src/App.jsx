import { Routes, Route, Link } from 'react-router-dom'
import Home from './screens/Home'
import Calendar from './screens/Calendar'
import ProtectRoute from './ui/ProtectRoute'
import AuthModal from './auth/AuthModal'
import { useAuth } from './auth/AuthContext'

export default function App() {
  const { user, logout } = useAuth()

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link to="/">Home</Link>
        {user && <Link to="/calendar">Calendar</Link>}
        <div style={{ marginLeft: 'auto' }}>
          {user ? (
            <>
              <span style={{ marginRight: 8 }}>{user.name || user.email}</span>
              <button onClick={logout}>Logout</button>
            </>
          ) : (
            <AuthModal />
          )}
        </div>
      </header>

      <main style={{ marginTop: 16 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<ProtectRoute />}>
            <Route path="/calendar" element={<Calendar />} />
          </Route>
        </Routes>
      </main>
    </div>
  )
}
