import React from 'react';
import { useError } from '../context/ErrorContext';

const PersistentBanner = () => {
  const { persistentError, retry } = useError();

  if (!persistentError) return null;

  return (
    <div className="persistent-banner" role="alert">
      <span className="persistent-banner-text">⚠ 服务异常，请刷新页面重试</span>
      <button className="persistent-banner-btn" onClick={retry}>重试</button>
    </div>
  );
};

export default PersistentBanner;
