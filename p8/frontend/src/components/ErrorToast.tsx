import React from 'react';
import { useError } from '../context/ErrorContext';

const ErrorToast: React.FC = () => {
  const { error, clearError } = useError();

  if (!error) return null;

  return (
    <div className="error-toast">
      <div className="error-toast-content">
        <span className="error-icon">!</span>
        <span className="error-message">{error}</span>
        <button className="error-close" onClick={clearError}>
          ×
        </button>
      </div>
    </div>
  );
};

export default ErrorToast;
