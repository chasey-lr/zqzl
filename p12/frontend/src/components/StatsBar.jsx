import React from 'react';

export default function StatsBar({ total, currentTotal, recent7Days }) {
  return (
    <div className="stats-bar">
      <span>总书签数：<strong>{total}</strong></span>
      <span>当前分类：<strong>{currentTotal}</strong></span>
      <span>最近7天添加：<strong>{recent7Days}</strong></span>
    </div>
  );
}
