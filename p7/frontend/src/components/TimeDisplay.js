import React from 'react';
import { formatRelativeTime, formatExactTime } from '../utils/helpers';

const TimeDisplay = ({ dateStr, className = '' }) => {
  if (!dateStr) return <span className={className}>—</span>;

  return (
    <span className={`time-tooltip ${className}`}>
      {formatRelativeTime(dateStr)}
      <span className="exact-time">{formatExactTime(dateStr)}</span>
    </span>
  );
};

export default TimeDisplay;
