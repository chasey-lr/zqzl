import React from 'react';

export default function FilterBar({ categories, category, onCategoryChange, search, onSearchChange }) {
  return (
    <div className="filter-bar">
      <div className="filter-item">
        <label>分类：</label>
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="all">全部分类</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="filter-item filter-search">
        <input
          type="text"
          placeholder="搜索标题或网址..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
