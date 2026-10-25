import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import Home from './pages/Home.jsx'
import NewFdr from './pages/NewFdr.jsx'
import FdrRecord from './pages/FdrRecord.jsx'
import Releases from './pages/Releases.jsx'
import Duplicates from './pages/Duplicates.jsx'

import Landing from './pages/public/Landing.jsx'
import Login from './pages/public/Login.jsx'
import Register from './pages/public/Register.jsx'
import VerifyReceipt from './pages/public/VerifyReceipt.jsx'
import PublicLayout from './components/public/PublicLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import NotFound from './pages/public/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      {/* Public pages wrapped in Header + Footer */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify" element={<VerifyReceipt />} />
      </Route>

      {/* Protected app pages wrapped in AppLayout */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="fdrs" element={<Home />} />
        <Route path="fdrs/new" element={<NewFdr />} />
        <Route path="fdrs/:id" element={<FdrRecord />} />
        <Route path="releases" element={<Releases />} />
        <Route path="duplicates" element={<Duplicates />} />
      </Route>

      {/* Legacy bare paths → redirect into /app */}
      <Route path="/fdrs" element={<Navigate to="/app/fdrs" replace />} />
      <Route path="/fdrs/new" element={<Navigate to="/app/fdrs/new" replace />} />
      <Route path="/fdrs/:id" element={<Navigate to="/app/fdrs/:id" replace />} />
      <Route path="/releases" element={<Navigate to="/app/releases" replace />} />
      <Route path="/duplicates" element={<Navigate to="/app/duplicates" replace />} />

      {/* Styled 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
