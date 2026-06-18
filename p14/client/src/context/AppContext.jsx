import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [errorCount, setErrorCount] = useState(0);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setErrorCount(0);
    return userData;
  }, []);

  const register = useCallback(async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setErrorCount(0);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setErrorCount(0);
  }, []);

  const incrementError = useCallback(() => {
    setErrorCount(prev => prev + 1);
  }, []);

  const resetErrorCount = useCallback(() => {
    setErrorCount(0);
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      isLoggedIn: !!user,
      errorCount,
      login,
      register,
      logout,
      incrementError,
      resetErrorCount
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
