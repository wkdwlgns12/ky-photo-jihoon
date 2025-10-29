import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.data)).catch(() => {})
  }, [])

  const login = async (email, password, remember) => {
    const { data } = await api.post('/auth/login', { email, password, remember })
    setUser(data)
  }
  const register = async (email, password, name) => {
    await api.post('/auth/register', { email, password, name })
    await login(email, password, true)
  }
  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  return useContext(Ctx)
}
