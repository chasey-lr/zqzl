import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { App as AntdApp } from 'antd';
import Login from './pages/Login';
import Register from './pages/Register';
import Contacts from './pages/Contacts';
import { useApp } from './context/AppContext';

function App() {
  const { isLoggedIn, errorCount, incrementError, resetErrorCount } = useApp();
  const { message } = AntdApp.useApp();
  const [persistentError, setPersistentError] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (errorCount >= 2) {
      setPersistentError(true);
    }
  }, [errorCount]);

  const handleRetry = () => {
    setPersistentError(false);
    resetErrorCount();
    window.location.reload();
  };

  return (
    <div>
      {persistentError && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#ff4d4f',
          color: 'white',
          padding: '12px 24px',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>服务异常，请检查网络连接</span>
          <button
            onClick={handleRetry}
            style={{
              background: 'white',
              color: '#ff4d4f',
              border: 'none',
              padding: '4px 12px',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            重试
          </button>
        </div>
      )}
      
      <Routes>
        <Route path="/login" element={
          isLoggedIn ? <Navigate to="/contacts" replace /> : <Login />
        } />
        <Route path="/register" element={
          isLoggedIn ? <Navigate to="/contacts" replace /> : <Register />
        } />
        <Route path="/contacts" element={
          isLoggedIn ? <Contacts /> : <Navigate to="/login" replace />
        } />
        <Route path="/" element={
          <Navigate to={isLoggedIn ? "/contacts" : "/login"} replace />
        } />
      </Routes>
    </div>
  );
}

export default App;
