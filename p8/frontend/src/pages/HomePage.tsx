import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Poll } from '../types';
import { useError } from '../context/ErrorContext';
import RelativeTime from '../components/RelativeTime';
import { formatRemainingTime } from '../utils/date';

const HomePage: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { showError } = useError();

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const response = await api.get('/polls/public', {
        params: { page, limit: 6 }
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
    fetchPolls();
  }, [page]);

  const isPollEnded = (poll: Poll) => {
    return poll.isEnded || new Date() > new Date(poll.deadline);
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">团队投票决策</h1>
        <p className="hero-subtitle">高效、透明的团队意见收集平台</p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">
            立即开始
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            登录账号
          </Link>
        </div>
      </div>

      <div className="public-polls-section">
        <h2 className="section-heading">公开投票</h2>

        {loading ? (
          <div className="loading">加载中...</div>
        ) : polls.length === 0 ? (
          <div className="empty-state">
            <p>暂无公开投票</p>
          </div>
        ) : (
          <>
            <div className="poll-grid">
              {polls.map((poll) => {
                const ended = isPollEnded(poll);
                const creatorName = typeof poll.creator === 'string'
                  ? poll.creator
                  : poll.creator.nickname;

                return (
                  <div key={poll._id} className="poll-card">
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
                      <span className="poll-creator">
                        创建者：{creatorName}
                      </span>
                    </div>

                    <Link to={`/poll/${poll._id}`} className="btn btn-outline btn-block">
                      查看详情
                    </Link>
                  </div>
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
    </div>
  );
};

export default HomePage;
