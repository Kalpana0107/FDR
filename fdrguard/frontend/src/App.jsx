import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import Home from './pages/Home.jsx'
import NewFdr from './pages/NewFdr.jsx'
import FdrRecord from './pages/FdrRecord.jsx'
import Releases from './pages/Releases.jsx'

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fdrs" element={<Home />} />
        <Route path="/fdrs/new" element={<NewFdr />} />
        <Route path="/fdrs/:id" element={<FdrRecord />} />
        <Route path="/releases" element={<Releases />} />
        {/* Fallback to Home shell for nested exploratory routes */}
        <Route path="*" element={<Home />} />
      </Routes>
    </AppLayout>
  )
}
