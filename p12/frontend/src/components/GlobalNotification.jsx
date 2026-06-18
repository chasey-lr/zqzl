import React from 'react';
import { useNotification } from '../context/NotificationContext';

export default function GlobalNotification() {
  const { toast, error } = useNotification();
  return (
    <>
      {error && <div className="error-banner">{error}</div>}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </>
  );
}
