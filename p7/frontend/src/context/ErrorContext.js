import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { addErrorListener, resetConsecutiveErrors } from '../utils/api';

const ErrorContext = createContext(null);

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const [persistentError, setPersistentError] = useState(null);
  const errorTimer = useRef(null);

  useEffect(() => {
    const remove = addErrorListener((message, isPersistent) => {
      if (isPersistent) {
        setPersistentError(message);
        setError(null);
      } else {
        setError(message);
        setPersistentError(null);
        if (errorTimer.current) clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => setError(null), 5000);
      }
    });

    return () => {
      remove();
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearPersistentError = useCallback(() => {
    setPersistentError(null);
    resetConsecutiveErrors();
  }, []);

  const retry = useCallback(() => {
    clearPersistentError();
    window.location.reload();
  }, [clearPersistentError]);

  return (
    <ErrorContext.Provider value={{
      error,
      persistentError,
      clearError,
      clearPersistentError,
      retry
    }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const ctx = useContext(ErrorContext);
  if (!ctx) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return ctx;
};
