import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getStatusText } from '../utils/helpers';
import TimeDisplay from '../components/TimeDisplay';

const PublicSurveys = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get(`/surveys/public?page=${page}&pageSize=10`);
      setSurveys(data.surveys);
      setPagination(data.pagination);
    } catch (err) {} finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  return (
    <div className="main-content container">
      <div className="page-header">
        <h1 className="page-title">📋 公开问卷</h1>
        <p className="page-subtitle">
          浏览社区开放中的问卷，点击即可参与填写
          {!user && <span style={{ marginLeft: 12 }}>
            想要创建自己的问卷？<Link to="/register">立即注册</Link>
          </span>}
        </p>
      </div>

      {loading ? (
        <div className="loading-container card">
          <span className="spinner" style={{ color: 'var(--primary)' }}></span>
          加载中...
        </div>
      ) : surveys.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">📭</div>
          <div className="empty-title">暂无公开问卷</div>
          <div className="empty-text">当前没有开放中的公开问卷</div>
          {user && (
            <button className="btn btn-primary" onClick={() => navigate('/surveys/create')}>
              + 创建第一个问卷
            </button>
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
                      <Link to={`/fill/${s.id}`} className="survey-title">
                        {s.title}
                      </Link>
                      {s.response_count > 50 && (
                        <span className="hot-badge" title="热门问卷">🔥</span>
                      )}
                      <span className={`survey-status status-${s.status}`}>
                        {getStatusText(s.status)}
                      </span>
                    </div>
                    {s.description && (
                      <p style={{
                        marginTop: 8,
                        fontSize: 14,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                        maxWidth: 600
                      }}>
                        {s.description.length > 120 ? s.description.slice(0, 120) + '...' : s.description}
                      </p>
                    )}
                  </div>
                  <div className="survey-actions">
                    <Link to={`/fill/${s.id}`} className="btn btn-primary btn-sm">
                      参与填写 →
                    </Link>
                  </div>
                </div>

                <div className="survey-meta">
                  <div className="survey-meta-item">
                    <span>👤</span>
                    <span>创建者：{s.creator_email}</span>
                  </div>
                  <div className="survey-meta-item">
                    <span>📝</span>
                    <span>{s.response_count} 人已参与</span>
                  </div>
                  <div className="survey-meta-item">
                    <span>🚀</span>
                    <span>发布于 <TimeDisplay dateStr={s.published_at} /></span>
                  </div>
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
  );
};

export default PublicSurveys;
