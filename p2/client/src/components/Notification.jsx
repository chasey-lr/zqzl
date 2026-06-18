import React, { useEffect, useState } from 'react';

function Notification({ notification, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, notification.duration || 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification || !visible) return null;

  return (
    <div className={`notification ${notification.type || 'success'}`}>
      <div className="notification-title">{notification.title}</div>
      {notification.message && (
        <div className="notification-message">{notification.message}</div>
      )}
    </div>
  );
}

export default Notification;
