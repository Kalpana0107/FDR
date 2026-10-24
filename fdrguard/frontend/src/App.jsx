import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import Home from './pages/Home.jsx'

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Fallback to Home shell for nested exploratory routes */}
        <Route path="*" element={<Home />} />
      </Routes>
    </AppLayout>
  )
}
