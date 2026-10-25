import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import Home from './pages/Home.jsx'
import Duplicates from './pages/Duplicates.jsx'
import NewFDR from './pages/NewFDR.jsx'

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fdrs" element={<Home />} />
        <Route path="/duplicates" element={<Duplicates />} />
        <Route path="/fdrs/new" element={<NewFDR />} />
        {/* Fallback to Home shell for nested exploratory routes */}
        <Route path="*" element={<Home />} />
      </Routes>
    </AppLayout>
  )
}
