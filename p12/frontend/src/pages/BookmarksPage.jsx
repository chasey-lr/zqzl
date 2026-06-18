import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { api, resetFailCount, triggerRetry, setGlobalFailHandlers } from '../utils/api';
import BookmarkList from '../components/BookmarkList.jsx';
import AddBookmarkModal from '../components/AddBookmarkModal.jsx';
import EditBookmarkModal from '../components/EditBookmarkModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import StatsBar from '../components/StatsBar.jsx';
import FilterBar from '../components/FilterBar.jsx';
import Pagination from '../components/Pagination.jsx';

export default function BookmarksPage() {
  const { user, logout } = useAuth();
  const { showToast, showError, setPersistentError, clearPersistentError } = useNotification();
  const [bookmarks, setBookmarks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, recent7Days: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, pageSize: 5, totalPages: 0 });
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getBookmarks({ category, search, page, pageSize: 5 });
      setBookmarks(data.bookmarks);
      setCategories(data.categories);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (err) {
      // Error handled by global handler
    } finally {
      setLoading(false);
    }
  }, [category, search, page]);

  useEffect(() => {
    const onFail = (persistent, msg) => {
      if (persistent) {
        setPersistentError(true);
      } else if (msg) {
        showError(msg);
      }
    };
    const onRetry = () => {
      clearPersistentError();
      resetFailCount();
      fetchBookmarks();
    };
    setGlobalFailHandlers(onFail, onRetry);
    const listener = () => triggerRetry();
    window.addEventListener('manualRetry', listener);
    return () => {
      window.removeEventListener('manualRetry', listener);
      setGlobalFailHandlers(null, null);
    };
  }, [setPersistentError, clearPersistentError, showError, fetchBookmarks]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  useEffect(() => {
    setPage(1);
  }, [category, search]);

  const handleAdd = async (data) => {
    try {
      await api.addBookmark(data);
      showToast('添加成功');
      setShowAddModal(false);
      setPage(1);
      fetchBookmarks();
    } catch (err) {
      showError(err.message || '添加失败');
    }
  };

  const handleEdit = async (data) => {
    try {
      await api.updateBookmark(editingBookmark.id, data);
      showToast('更新成功');
      setEditingBookmark(null);
      fetchBookmarks();
    } catch (err) {
      showError(err.message || '更新失败');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteBookmark(deleteTarget.id);
      showToast('删除成功');
      setDeleteTarget(null);
      fetchBookmarks();
    } catch (err) {
      showError(err.message || '删除失败');
    }
  };

  return (
    <div className="bookmarks-page">
      <header className="page-header">
        <h1>我的书签</h1>
        <div className="header-actions">
          <span className="user-email">{user?.email}</span>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>添加书签</button>
          <button className="btn btn-ghost" onClick={logout}>退出登录</button>
        </div>
      </header>

      <FilterBar
        categories={categories}
        category={category}
        onCategoryChange={setCategory}
        search={search}
        onSearchChange={setSearch}
      />

      {loading ? (
        <div className="loading">加载中...</div>
      ) : bookmarks.length === 0 ? (
        <div className="empty-state">暂无书签，点击"添加书签"开始收藏吧</div>
      ) : (
        <>
          <BookmarkList
            bookmarks={bookmarks}
            onEdit={setEditingBookmark}
            onDelete={(b) => setDeleteTarget(b)}
          />
          {pagination.totalPages > 1 && (
            <Pagination pagination={pagination} onPageChange={setPage} />
          )}
        </>
      )}

      <StatsBar
        total={stats.total}
        currentTotal={pagination.total}
        recent7Days={stats.recent7Days}
      />

      {showAddModal && (
        <AddBookmarkModal onClose={() => setShowAddModal(false)} onSubmit={handleAdd} />
      )}
      {editingBookmark && (
        <EditBookmarkModal
          bookmark={editingBookmark}
          onClose={() => setEditingBookmark(null)}
          onSubmit={handleEdit}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="确认删除"
          message="确认删除该书签吗？"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
