import React from 'react';
import { formatRelativeTime, formatAbsoluteTime, truncateUrl } from '../utils/helpers';
import ConfirmDialog from './ConfirmDialog.jsx';

export default function BookmarkList({ bookmarks, onEdit, onDelete }) {
  const [confirmUrl, setConfirmUrl] = React.useState(null);

  const handleLinkClick = (e, url) => {
    e.preventDefault();
    setConfirmUrl(url);
  };

  const confirmJump = () => {
    if (confirmUrl) {
      window.open(confirmUrl, '_blank', 'noopener,noreferrer');
      setConfirmUrl(null);
    }
  };

  return (
    <div className="bookmark-list">
      {bookmarks.map((b) => (
        <div key={b.id} className="bookmark-item">
          <div className="bookmark-main">
            <div className="bookmark-title-row">
              <a
                href={b.url}
                className="bookmark-title"
                onClick={(e) => handleLinkClick(e, b.url)}
              >
                {b.title}
              </a>
              {b.category && <span className="bookmark-category">{b.category}</span>}
            </div>
            <div className="bookmark-url-wrapper">
              <span
                className="bookmark-url"
                title={b.url}
                onClick={(e) => handleLinkClick(e, b.url)}
              >
                {truncateUrl(b.url)}
              </span>
            </div>
            {b.note && <div className="bookmark-note">{b.note}</div>}
            <div className="bookmark-time">
              <span title={formatAbsoluteTime(b.createdAt)}>
                添加于 {formatRelativeTime(b.createdAt)}
              </span>
              {b.updatedAt !== b.createdAt && (
                <span className="updated-time" title={formatAbsoluteTime(b.updatedAt)}>
                  · 更新于 {formatRelativeTime(b.updatedAt)}
                </span>
              )}
            </div>
          </div>
          <div className="bookmark-actions">
            <button className="btn btn-sm" onClick={() => onEdit(b)}>编辑</button>
            <button className="btn btn-sm btn-danger" onClick={() => onDelete(b)}>删除</button>
          </div>
        </div>
      ))}

      {confirmUrl && (
        <ConfirmDialog
          title="跳转确认"
          message="即将跳转到外部链接，是否继续？"
          onConfirm={confirmJump}
          onCancel={() => setConfirmUrl(null)}
          confirmText="继续"
        />
      )}
    </div>
  );
}
