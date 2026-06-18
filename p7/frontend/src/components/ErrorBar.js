import React from 'react';
import { useError } from '../context/ErrorContext';

const ErrorBar = () => {
  const { error, clearError } = useError();

  if (!error) return null;

  return (
    <div className="error-bar" role="alert">
      <span className="error-bar-message">⚠ {error}</span>
      <button className="error-bar-close" onClick={clearError} aria-label="关闭">×</button>
    </div>
  );
};

export default ErrorBar;
