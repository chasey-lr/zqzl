import React, { useState } from 'react';
import { formatRelativeTime, formatPreciseTime } from '../utils/date';

interface RelativeTimeProps {
  date: string;
  className?: string;
}

const RelativeTime: React.FC<RelativeTimeProps> = ({ date, className = '' }) => {
  const [showPrecise, setShowPrecise] = useState(false);

  return (
    <span
      className={`relative-time ${className}`}
      title={showPrecise ? formatPreciseTime(date) : undefined}
      onMouseEnter={() => setShowPrecise(true)}
      onMouseLeave={() => setShowPrecise(false)}
    >
      {formatRelativeTime(date)}
    </span>
  );
};

export default RelativeTime;
