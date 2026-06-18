import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useNotification } from './context/NotificationContext';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import BookmarksPage from './pages/BookmarksPage.jsx';
import GlobalNotification from './components/GlobalNotification.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">加载中...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">加载中...</div>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  const { persistentError } = useNotification();
  return (
    <div className="app">
      <GlobalNotification />
      {persistentError && (
        <div className="persistent-error-banner">
          <span>服务暂时不可用</span>
          <button onClick={() => window.dispatchEvent(new CustomEvent('manualRetry'))}>手动重试</button>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
