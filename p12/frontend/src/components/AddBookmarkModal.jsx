import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { isValidUrl } from '../utils/helpers';

export default function AddBookmarkModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const { showError } = useNotification();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showError('标题不能为空');
      return;
    }
    if (title.length > 50) {
      showError('标题最多50个字符');
      return;
    }
    if (!isValidUrl(url)) {
      showError('请输入有效的URL（以http或https开头）');
      return;
    }
    if (category && category.length > 20) {
      showError('分类最多20个字符');
      return;
    }
    onSubmit({
      title: title.trim(),
      url: url.trim(),
      category: category.trim() || null,
      note: note.trim() || null
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>添加书签</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>标题 <span className="required">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="书签标题（最多50字）"
              maxLength={50}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label>网址 <span className="required">*</span></label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>分类</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="可选，最多20字"
              maxLength={20}
            />
          </div>
          <div className="form-group">
            <label>备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="可选，添加备注说明"
              rows={3}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary">添加</button>
          </div>
        </form>
      </div>
    </div>
  );
}
