import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);
  const [persistentError, setPersistentError] = useState(false);

  const showToast = useCallback((message, type = 'success', duration = 2000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  const showError = useCallback((msg) => {
    setError(msg || '操作失败，请重试');
    setTimeout(() => setError(null), 4000);
  }, []);

  const clearPersistentError = useCallback(() => {
    setPersistentError(false);
  }, []);

  useEffect(() => {
    if (persistentError) {
      setError(null);
    }
  }, [persistentError]);

  return (
    <NotificationContext.Provider value={{ toast, error, persistentError, showToast, showError, setPersistentError, clearPersistentError }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}
