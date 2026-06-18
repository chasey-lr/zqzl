import React from 'react';

function getPageNumbers(currentPage, totalPages) {
  const pages = [];
  const maxVisible = 7;

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  pages.push(1);

  if (currentPage <= 4) {
    for (let i = 2; i <= 5; i++) {
      pages.push(i);
    }
    pages.push('ellipsis');
  } else if (currentPage >= totalPages - 3) {
    pages.push('ellipsis');
    for (let i = totalPages - 4; i <= totalPages - 1; i++) {
      pages.push(i);
    }
  } else {
    pages.push('ellipsis');
    for (let i = currentPage - 2; i <= currentPage + 2; i++) {
      pages.push(i);
    }
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
}

export default function Pagination({ pagination, onPageChange }) {
  const { page, totalPages } = pagination;

  if (!totalPages || totalPages <= 1 || !page) return null;

  const safePage = Math.max(1, Math.min(page, totalPages));
  const pages = getPageNumbers(safePage, totalPages);

  return (
    <div className="pagination">
      <button
        className="btn btn-sm"
        disabled={safePage <= 1}
        onClick={() => onPageChange(1)}
        title="首页"
      >
        «
      </button>
      <button
        className="btn btn-sm"
        disabled={safePage <= 1}
        onClick={() => onPageChange(safePage - 1)}
      >
        上一页
      </button>
      {pages.map((p, idx) => (
        p === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`btn btn-sm ${p === safePage ? 'btn-active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      ))}
      <button
        className="btn btn-sm"
        disabled={safePage >= totalPages}
        onClick={() => onPageChange(safePage + 1)}
      >
        下一页
      </button>
      <button
        className="btn btn-sm"
        disabled={safePage >= totalPages}
        onClick={() => onPageChange(totalPages)}
        title="末页"
      >
        »
      </button>
    </div>
  );
}
