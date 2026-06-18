import React, { useState, useEffect } from 'react';
import { api, logger } from '../utils/api';

function HealthStatus() {
  const [timestamp, setTimestamp] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await api.getHealth();
        setTimestamp(data.timestamp);
        setError(false);
      } catch (err) {
        setError(true);
        logger.warn('Health check failed');
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoStr) => {
    if (!isoStr) return '--:--:--';
    const date = new Date(isoStr);
    return date.toLocaleTimeString('zh-CN', { hour12: false });
  };

  return (
    <div className="health-footer">
      <div className="health-status">
        <span className={`health-dot ${error ? 'error' : ''}`}></span>
        <span>{error ? '服务连接异常' : '服务运行正常'}</span>
      </div>
      <div>
        服务器时间: {formatTime(timestamp)}
      </div>
    </div>
  );
}

export default HealthStatus;
