import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Poll } from '../types';
import { useError } from '../context/ErrorContext';
import RelativeTime from '../components/RelativeTime';
import { formatRemainingTime } from '../utils/date';
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { showError } = useError();
  const { user } = useAuth();

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const response = await api.get('/polls', {
        params: { status, search, page, limit: 6 }
      });
      setPolls(response.data.polls);
      setTotalPages(response.data.pages);
      setTotal(response.data.total);
    } catch (err: any) {
      showError(err.response?.data?.message || '获取投票列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setPage(1);
      fetchPolls();
    }
  }, [status, search, user]);

  useEffect(() => {
    if (user && page > 1) {
      fetchPolls();
    }
  }, [page, user]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
  };

  const isPollEnded = (poll: Poll) => {
    return poll.isEnded || new Date() > new Date(poll.deadline);
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">我的投票</h1>
        <Link to="/create" className="btn btn-primary">
          + 创建新投票
        </Link>
      </div>

      <div className="filter-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${status === 'all' ? 'active' : ''}`}
            onClick={() => handleStatusChange('all')}
          >
            全部
          </button>
          <button
            className={`filter-tab ${status === 'active' ? 'active' : ''}`}
            onClick={() => handleStatusChange('active')}
          >
            进行中
          </button>
          <button
            className={`filter-tab ${status === 'ended' ? 'active' : ''}`}
            onClick={() => handleStatusChange('ended')}
          >
            已结束
          </button>
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="搜索投票主题..."
            value={search}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : polls.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>暂无投票</p>
          <Link to="/create" className="btn btn-primary">
            创建第一个投票
          </Link>
        </div>
      ) : (
        <>
          <div className="poll-grid">
            {polls.map((poll) => {
              const ended = isPollEnded(poll);
              return (
                <Link
                  to={`/poll/${poll._id}`}
                  key={poll._id}
                  className="poll-card"
                >
                  <div className="poll-card-header">
                    <h3 className="poll-title">{poll.title}</h3>
                    <span className={`poll-type ${poll.type}`}>
                      {poll.type === 'public' ? '公开' : '私密'}
                    </span>
                  </div>

                  {poll.description && (
                    <p className="poll-description">{poll.description}</p>
                  )}

                  <div className="poll-meta">
                    <span className={`poll-status ${ended ? 'ended' : 'active'}`}>
                      {ended ? '已结束' : '进行中'}
                    </span>
                    <span className="poll-participants">
                      👥 {poll.totalVotes} 人参与
                    </span>
                  </div>

                  <div className="poll-footer">
                    <span className="poll-remaining">
                      {formatRemainingTime(poll.deadline, ended)}
                    </span>
                    <span className="poll-created">
                      <RelativeTime date={poll.createdAt} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </button>
              <span className="page-info">
                第 {page} / {totalPages} 页，共 {total} 条
              </span>
              <button
                className="page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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

export default DashboardPage;
