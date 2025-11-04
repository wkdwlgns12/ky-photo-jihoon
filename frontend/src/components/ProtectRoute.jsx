import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
export default function ProtectRoute({ isAuthed, user, requiredRole, redirect='/' }){
  const location = useLocation()
  if (!isAuthed) return <Navigate to={redirect} replace state={{ from: location }} />
  if (requiredRole && user?.role !== requiredRole) return <Navigate to='/' replace />
  return <Outlet />
}
