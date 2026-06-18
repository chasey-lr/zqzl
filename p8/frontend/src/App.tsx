import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import Header from './components/Header';
import ErrorToast from './components/ErrorToast';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreatePollPage from './pages/CreatePollPage';
import PollDetailPage from './pages/PollDetailPage';
import EditPollPage from './pages/EditPollPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AuthenticatedRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const HomeOrDashboard: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return user ? <DashboardPage /> : <HomePage />;
};

const App: React.FC = () => {
  return (
    <ErrorProvider>
      <AuthProvider>
        <Router>
          <div className="app">
            <Header />
            <ErrorToast />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<HomeOrDashboard />} />
                <Route
                  path="/login"
                  element={
                    <AuthenticatedRedirect>
                      <LoginPage />
                    </AuthenticatedRedirect>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <AuthenticatedRedirect>
                      <RegisterPage />
                    </AuthenticatedRedirect>
                  }
                />
                <Route
                  path="/create"
                  element={
                    <ProtectedRoute>
                      <CreatePollPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/poll/:id" element={<PollDetailPage />} />
                <Route
                  path="/poll/:id/edit"
                  element={
                    <ProtectedRoute>
                      <EditPollPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<div className="not-found">页面不存在</div>} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ErrorProvider>
  );
};

export default App;
