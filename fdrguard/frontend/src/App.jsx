import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import Home from './pages/Home.jsx'
import Duplicates from './pages/Duplicates.jsx'
import NewFDR from './pages/NewFDR.jsx'
import OfficerQueue from './pages/OfficerQueue.jsx'
import ManagementDashboard from './pages/ManagementDashboard.jsx'
import Releases from './pages/Releases.jsx'
import AuditChain from './pages/AuditChain.jsx'
import PublicVerifyReceipt from './pages/PublicVerifyReceipt.jsx'

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fdrs" element={<Home />} />
        <Route path="/verify" element={<OfficerQueue />} />
        <Route path="/officer-queue" element={<OfficerQueue />} />
        <Route path="/duplicates" element={<Duplicates />} />
        <Route path="/management" element={<ManagementDashboard />} />
        <Route path="/releases" element={<Releases />} />
        <Route path="/audit" element={<AuditChain />} />
        <Route path="/verify-receipt" element={<PublicVerifyReceipt />} />
        <Route path="/fdrs/new" element={<NewFDR />} />
        {/* Fallback to Home shell for nested exploratory routes */}
        <Route path="*" element={<Home />} />
      </Routes>
    </AppLayout>
  )
}
