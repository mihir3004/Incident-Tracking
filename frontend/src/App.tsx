import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import IncidentReportPage from './pages/IncidentReportPage';
import Dashboard from './pages/Dashboard';
import IncidentListPage from './pages/IncidentListPage';
import UserManagementPage from './pages/UserManagementPage';
import AuditLogsPage from './pages/AuditLogsPage';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/report" element={
              <ProtectedRoute roles={['USER']}>
                <Layout>
                  <IncidentReportPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/incidents" element={
              <ProtectedRoute roles={['USER', 'ADMIN', 'SUPER_ADMIN']}>
                <Layout>
                  <IncidentListPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/users" element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <Layout>
                  <UserManagementPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/logs" element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <Layout>
                  <AuditLogsPage />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
