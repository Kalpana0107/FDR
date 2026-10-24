import React from 'react';
import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './store/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import CollegeDashboard from './pages/CollegeDashboard';
import FDRListPage from './pages/FDRListPage';
import FDRFormPage from './pages/FDRFormPage';
import FDRDetailPage from './pages/FDRDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminFDRListPage from './pages/AdminFDRListPage';
import AdminFDRReviewPage from './pages/AdminFDRReviewPage';
import ProfilePage from './pages/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* College user routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<CollegeDashboard />} />
            <Route path="/fdr" element={<FDRListPage />} />
            <Route path="/fdr/new" element={<FDRFormPage />} />
            <Route path="/fdr/:id" element={<FDRDetailPage />} />
            <Route path="/fdr/:id/edit" element={<FDRFormPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/fdr" element={<AdminFDRListPage />} />
            <Route path="/admin/fdr/:id" element={<AdminFDRReviewPage />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0f2044',
            color: 'white',
            borderRadius: '10px',
            fontSize: '13.5px',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: 'white' } },
        }}
      />
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
