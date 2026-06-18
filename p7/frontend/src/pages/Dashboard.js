import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getStatusText, copyToClipboard } from '../utils/helpers';
import TimeDisplay from '../components/TimeDisplay';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [deleteModal, setDeleteModal] = useState(null);
  const [closeModal, setCloseModal] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/surveys?status=${status}&search=${encodeURIComponent(search)}&page=${page}&pageSize=5`);
      setSurveys(data.surveys);
      setPagination(data.pagination);
    } catch (err) {
      // error handled globally
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (user) fetchSurveys();
  }, [fetchSurveys, user]);

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  const handlePublish = async (id) => {
    try {
      await api.post(`/surveys/${id}/publish`);
      setToast({ message: '问卷发布成功！', type: 'success' });
      fetchSurveys();
    } catch (err) {}
  };

  const handleClose = async (id) => {
    try {
      await api.post(`/surveys/${id}/close`);
      setCloseModal(null);
      setToast({ message: '问卷已关闭', type: 'success' });
      fetchSurveys();
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/surveys/${id}`);
      setDeleteModal(null);
      setToast({ message: '问卷已删除', type: 'success' });
      if (surveys.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchSurveys();
      }
    } catch (err) {}
  };

  const handleCopyLink = async (id) => {
    const link = `${window.location.origin}/fill/${id}`;
    const ok = await copyToClipboard(link);
    if (ok) {
      setToast({ message: '链接已复制到剪贴板', type: 'success' });
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <Modal
        isOpen={!!deleteModal}
        title="确认删除"
        message={`确定要删除问卷"${deleteModal?.title}"吗？此操作将同时删除所有回答数据，且不可恢复。`}
        confirmText="删除"
        danger
        onConfirm={() => handleDelete(deleteModal.id)}
        onCancel={() => setDeleteModal(null)}
      />

      <Modal
        isOpen={!!closeModal}
        title="确认关闭问卷"
        message={`确定要关闭问卷"${closeModal?.title}"吗？关闭后将不再接收新回答，但统计结果仍可查看。关闭后不可再次打开。`}
        confirmText="确认关闭"
        danger
        onConfirm={() => handleClose(closeModal.id)}
        onCancel={() => setCloseModal(null)}
      />

      <div className="main-content container">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 className="page-title">我的工作台</h1>
            <p className="page-subtitle">管理您创建的所有问卷</p>
          </div>
          <Link to="/surveys/create" className="btn btn-primary btn-lg">
            + 创建问卷
          </Link>
        </div>

        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-input">
              <input
                type="text"
                className="form-input"
                placeholder="搜索问卷标题..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 38 }}
              />
              <span style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }}>🔍</span>
            </div>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: 140 }}
            >
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="open">开放中</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <span className="spinner" style={{ color: 'var(--primary)' }}></span>
            加载中...
          </div>
        ) : surveys.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📋</div>
            <div className="empty-title">暂无问卷</div>
            <div className="empty-text">
              {search || status !== 'all' ? '没有找到符合条件的问卷' : '点击右上角"创建问卷"开始创建您的第一个问卷吧'}
            </div>
            {(!search && status === 'all') && (
              <Link to="/surveys/create" className="btn btn-primary">
                + 创建问卷
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="survey-list">
              {surveys.map((s) => (
                <div key={s.id} className="survey-item">
                  <div className="survey-item-header">
                    <div>
                      <div className="survey-title-row">
                        <Link to={`/surveys/${s.id}`} className="survey-title">
                          {s.title}
                        </Link>
                        {s.response_count > 50 && (
                          <span className="hot-badge" title="热门问卷（超过50份提交）">🔥</span>
                        )}
                        <span className={`survey-status status-${s.status}`}>
                          {getStatusText(s.status)}
                        </span>
                      </div>
                    </div>
                    <div className="survey-actions">
                      {s.status === 'draft' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => navigate(`/surveys/${s.id}/edit`)}>
                            编辑
                          </button>
                          <button className="btn btn-success btn-sm" onClick={() => handlePublish(s.id)}>
                            发布
                          </button>
                        </>
                      )}
                      {s.status === 'open' && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleCopyLink(s.id)}
                          >
                            复制链接
                          </button>
                          <Link to={`/fill/${s.id}`} className="btn btn-secondary btn-sm" target="_blank">
                            预览
                          </Link>
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => setCloseModal({ id: s.id, title: s.title })}
                          >
                            关闭
                          </button>
                        </>
                      )}
                      {s.status === 'closed' && (
                        <Link to={`/stats/${s.id}`} className="btn btn-secondary btn-sm">
                          查看统计
                        </Link>
                      )}
                      <Link to={`/stats/${s.id}`} className="btn btn-primary btn-sm">
                        查看统计
                      </Link>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteModal({ id: s.id, title: s.title })}
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  <div className="survey-meta">
                    <div className="survey-meta-item">
                      <span>📝</span>
                      <span>{s.response_count} 份提交</span>
                    </div>
                    <div className="survey-meta-item">
                      <span>📅</span>
                      <span>创建于 <TimeDisplay dateStr={s.created_at} /></span>
                    </div>
                    {s.published_at && (
                      <div className="survey-meta-item">
                        <span>🚀</span>
                        <span>发布于 <TimeDisplay dateStr={s.published_at} /></span>
                      </div>
                    )}
                    {s.closed_at && (
                      <div className="survey-meta-item">
                        <span>🔒</span>
                        <span>关闭于 <TimeDisplay dateStr={s.closed_at} /></span>
                      </div>
                    )}
                    {s.deadline && (
                      <div className="survey-meta-item">
                        <span>⏰</span>
                        <span>截止 <TimeDisplay dateStr={s.deadline} /></span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  上一页
                </button>
                <span className="pagination-info">
                  第 {page} / {pagination.totalPages} 页，共 {pagination.total} 份问卷
                </span>
                <button
                  className="pagination-btn"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Dashboard;
