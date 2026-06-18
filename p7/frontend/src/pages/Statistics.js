import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getStatusText, formatExactTime } from '../utils/helpers';

const Statistics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(`/responses/stats/${id}`);
      setStats(data);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('问卷不存在或您无权查看统计');
      } else {
        setError(err.message || '加载统计数据失败');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!user) navigate('/login');
    else fetchStats();
  }, [user, navigate, fetchStats]);

  if (loading) {
    return (
      <div className="main-content container">
        <div className="loading-container">
          <span className="spinner" style={{ color: 'var(--primary)' }}></span>
          加载统计数据...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-content container">
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-title">加载失败</div>
            <div className="empty-text">{error}</div>
            <Link to="/dashboard" className="btn btn-primary">返回工作台</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="main-content container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="page-title">
            {stats.survey.title}
            {stats.totalResponses > 50 && (
              <span className="hot-badge" style={{ marginLeft: 8 }}>🔥</span>
            )}
          </h1>
          <p className="page-subtitle">
            <span className={`survey-status status-${stats.survey.status}`} style={{ marginRight: 12 }}>
              {getStatusText(stats.survey.status)}
            </span>
            问卷统计结果
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          ← 返回工作台
        </button>
      </div>

      <div className="stats-header">
        <div className="stats-summary">
          <div className="stats-stat">
            <div className="stat-icon">📝</div>
            <div>
              <div className="stat-value">{stats.totalResponses}</div>
              <div className="stat-label">总提交人数</div>
            </div>
          </div>
          <div className="stats-stat">
            <div className="stat-icon">❓</div>
            <div>
              <div className="stat-value">{stats.questionStats.length}</div>
              <div className="stat-label">问题总数</div>
            </div>
          </div>
          <div className="stats-stat">
            <div className="stat-icon">📅</div>
            <div>
              <div className="stat-value" style={{ fontSize: 14 }}>
                {formatExactTime(stats.survey.created_at)}
              </div>
              <div className="stat-label">创建时间</div>
            </div>
          </div>
          {stats.survey.published_at && (
            <div className="stats-stat">
              <div className="stat-icon">🚀</div>
              <div>
                <div className="stat-value" style={{ fontSize: 14 }}>
                  {formatExactTime(stats.survey.published_at)}
                </div>
                <div className="stat-label">发布时间</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {stats.totalResponses === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-title">暂无提交数据</div>
            <div className="empty-text">目前还没有人提交此问卷，分享问卷链接以收集更多回答吧！</div>
          </div>
        </div>
      ) : (
        <div>
          {stats.questionStats.map((qs, idx) => (
            <div key={qs.questionId} className="stats-section">
              <h3 className="stats-question-title">
                <span style={{ color: 'var(--text-secondary)', marginRight: 8 }}>{idx + 1}.</span>
                {qs.title}
                <span style={{
                  marginLeft: 12,
                  fontSize: 12,
                  fontWeight: 400,
                  color: 'var(--text-muted)',
                  background: 'var(--bg)',
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  {qs.type === 'single' && '单选题'}
                  {qs.type === 'multiple' && '多选题'}
                  {qs.type === 'text' && '文本题'}
                  {qs.required && ' · 必答'}
                </span>
              </h3>

              {(qs.type === 'single' || qs.type === 'multiple') && (
                <div className="bar-chart">
                  {qs.options.map((opt, i) => (
                    <div key={i} className="bar-item">
                      <div className="bar-label" title={opt.label}>
                        {opt.label}
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${Math.max(opt.percentage, opt.count > 0 ? 2 : 0)}%` }}
                        >
                          {opt.percentage > 8 ? `${opt.percentage}%` : ''}
                        </div>
                      </div>
                      <div className="bar-count">
                        {opt.count} 票 {opt.percentage > 8 ? '' : `(${opt.percentage}%)`}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {qs.type === 'text' && (
                <div>
                  {qs.textAnswers && qs.textAnswers.length > 0 ? (
                    <div className="text-answer-list">
                      {qs.textAnswers.map((ta) => (
                        <div key={ta.index} className="text-answer-item">
                          <span className="text-answer-index">#{ta.index}</span>
                          <span className="text-answer-content">{ta.content}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                      暂无文本回答
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Statistics;
