import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Poll, Comment } from '../types';
import { useAuth } from '../context/AuthContext';
import { useError } from '../context/ErrorContext';
import ProgressBar from '../components/ProgressBar';
import RelativeTime from '../components/RelativeTime';
import { formatRemainingTime, formatPreciseTime, getInitials } from '../utils/date';

const PollDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [pollingPaused, setPollingPaused] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const { user } = useAuth();
  const { showError } = useError();
  const navigate = useNavigate();
  const pollIntervalRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);

  const isEnded = poll ? (poll.isEnded || new Date() > new Date(poll.deadline)) : false;
  const isCreator = user && poll && (typeof poll.creator === 'string'
    ? poll.creator === user._id
    : poll.creator._id === user._id);

  const fetchPoll = useCallback(async (showErr = true) => {
    try {
      const response = await api.get(`/polls/${id}`);
      setPoll(response.data);
      setConsecutiveErrors(0);
      setPollingPaused(false);
      return response.data;
    } catch (err: any) {
      if (showErr) {
        showError(err.response?.data?.message || '获取投票详情失败');
      }
      setConsecutiveErrors(prev => {
        const newCount = prev + 1;
        if (newCount >= 3) {
          setPollingPaused(true);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
        return newCount;
      });
      throw err;
    }
  }, [id, showError]);

  const fetchComments = useCallback(async () => {
    try {
      const response = await api.get(`/comments/${id}`);
      setComments(response.data.comments);
    } catch (err: any) {
      // 评论获取失败不显示全局错误
    }
  }, [id]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await fetchPoll();
      await fetchComments();
    } catch (err) {
      // 错误已在 fetchPoll 中处理
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (!isEnded && !pollingPaused && isVisibleRef.current) {
      pollIntervalRef.current = window.setInterval(() => {
        if (isVisibleRef.current) {
          fetchPoll(false);
          fetchComments();
        }
      }, 10000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isEnded, pollingPaused, fetchPoll, fetchComments]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (!document.hidden && !isEnded) {
        fetchPoll(false);
        fetchComments();
        if (pollingPaused) {
          setPollingPaused(false);
          setConsecutiveErrors(0);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnded, pollingPaused, fetchPoll, fetchComments]);

  const handleVote = async () => {
    if (selectedOption === null || !user) return;

    setVoting(true);
    try {
      const response = await api.post(`/polls/${id}/vote`, { optionIndex: selectedOption });
      setPoll(response.data);
      setIsChanging(false);
      setSelectedOption(null);
    } catch (err: any) {
      showError(err.response?.data?.message || '投票失败');
    } finally {
      setVoting(false);
    }
  };

  const handleManualRefresh = async () => {
    setPollingPaused(false);
    setConsecutiveErrors(0);
    fetchPoll(false);
    fetchComments();
  };

  const handleEndPoll = async () => {
    if (!window.confirm('确定要提前结束此投票吗？结束后不可恢复。')) {
      return;
    }

    try {
      await api.post(`/polls/${id}/end`);
      fetchPoll();
    } catch (err: any) {
      showError(err.response?.data?.message || '结束投票失败');
    }
  };

  const handleDeletePoll = async () => {
    if (!window.confirm('确定要删除此投票吗？所有投票数据和评论将被清除，不可恢复。')) {
      return;
    }

    try {
      await api.delete(`/polls/${id}`);
      navigate('/');
    } catch (err: any) {
      showError(err.response?.data?.message || '删除投票失败');
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setCommentLoading(true);
    try {
      const response = await api.post(`/comments/${id}`, { content: commentText.trim() });
      setComments(prev => [response.data, ...prev]);
      setCommentText('');
    } catch (err: any) {
      showError(err.response?.data?.message || '发表评论失败');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      showError('请先登录');
      return;
    }

    try {
      const response = await api.post(`/comments/${commentId}/like`);
      setComments(prev => prev.map(c =>
        c._id === commentId ? response.data : c
      ));
    } catch (err: any) {
      showError(err.response?.data?.message || '点赞失败');
    }
  };

  const getVoters = () => {
    if (!poll) return [];
    return poll.voteRecords.map(r => r.user).filter(Boolean);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!poll) {
    return <div className="empty-state">投票不存在</div>;
  }

  const hasVoted = poll.userVote !== null;
  const voters = getVoters();

  return (
    <div className="poll-detail-page">
      <div className="poll-detail-header">
        <div className="poll-info">
          <h1 className="poll-title">{poll.title}</h1>
          {poll.description && (
            <p className="poll-description">{poll.description}</p>
          )}
          <div className="poll-meta-row">
            <span className={`poll-type ${poll.type}`}>
              {poll.type === 'public' ? '公开投票' : '私密投票'}
            </span>
            <span className={`poll-status ${isEnded ? 'ended' : 'active'}`}>
              {isEnded ? '已结束' : '进行中'}
            </span>
            <span
              className="poll-deadline"
              title={formatPreciseTime(poll.deadline)}
            >
              {formatRemainingTime(poll.deadline, isEnded)}
            </span>
            <span className="poll-total">
              共 {poll.totalVotes} 人参与
            </span>
          </div>
        </div>

        {isCreator && !isEnded && (
          <div className="creator-actions">
            <button onClick={handleEndPoll} className="btn btn-secondary">
              提前结束
            </button>
            <button
              onClick={() => navigate(`/poll/${id}/edit`)}
              className="btn btn-secondary"
            >
              编辑
            </button>
            <button onClick={handleDeletePoll} className="btn btn-danger">
              删除
            </button>
          </div>
        )}
      </div>

      {pollingPaused && (
        <div className="polling-paused-banner">
          <span>结果更新暂停，请点击手动刷新</span>
          <button onClick={handleManualRefresh} className="btn btn-primary btn-sm">
            刷新
          </button>
        </div>
      )}

      <div className="poll-options-section">
        {!hasVoted && !isEnded && !isChanging ? (
          <div className="vote-options">
            <p className="vote-hint">请选择一个选项：</p>
            <div className="options-list">
              {poll.options.map((option, index) => (
                <div
                  key={index}
                  className={`vote-option ${selectedOption === index ? 'selected' : ''}`}
                  onClick={() => setSelectedOption(index)}
                >
                  <div
                    className="option-radio"
                    style={{ borderColor: option.color }}
                  >
                    {selectedOption === index && (
                      <div
                        className="option-radio-inner"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                  </div>
                  <span className="option-text">{option.text}</span>
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary btn-vote"
              onClick={handleVote}
              disabled={selectedOption === null || voting}
            >
              {voting ? '投票中...' : '确认投票'}
            </button>
          </div>
        ) : (
          <div className="vote-results">
            {hasVoted && !isEnded && (
              <div className="voted-notice">
                <span>✓ 您已投票</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setIsChanging(true);
                    setSelectedOption(poll.userVote?.optionIndex || null);
                  }}
                >
                  更改投票
                </button>
              </div>
            )}

            {isChanging && (
              <div className="change-vote-section">
                <p className="vote-hint">请重新选择：</p>
                <div className="options-list">
                  {poll.options.map((option, index) => (
                    <div
                      key={index}
                      className={`vote-option ${selectedOption === index ? 'selected' : ''}`}
                      onClick={() => setSelectedOption(index)}
                    >
                      <div
                        className="option-radio"
                        style={{ borderColor: option.color }}
                      >
                        {selectedOption === index && (
                          <div
                            className="option-radio-inner"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                      </div>
                      <span className="option-text">{option.text}</span>
                    </div>
                  ))}
                </div>
                <div className="change-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setIsChanging(false);
                      setSelectedOption(null);
                    }}
                  >
                    取消
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleVote}
                    disabled={selectedOption === null || voting}
                  >
                    {voting ? '提交中...' : '确认更改'}
                  </button>
                </div>
              </div>
            )}

            {!isChanging && (
              <div className="progress-bars">
                {poll.options.map((option, index) => {
                  const percentage = poll.totalVotes > 0
                    ? (option.votes / poll.totalVotes) * 100
                    : 0;
                  return (
                    <ProgressBar
                      key={index}
                      text={option.text}
                      votes={option.votes}
                      percentage={percentage}
                      color={option.color}
                      totalVotes={poll.totalVotes}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {poll.type === 'public' && voters.length > 0 && (
        <div className="voters-section">
          <h3 className="section-title">参与投票的用户</h3>
          <div className="voters-list">
            {voters.slice(0, 10).map((voter, index) => (
              <div key={index} className="voter-item" title={voter?.nickname}>
                <div className="avatar-small">
                  {voter ? getInitials(voter.nickname) : '?'}
                </div>
              </div>
            ))}
            {voters.length > 10 && (
              <div className="voter-more">+{voters.length - 10}</div>
            )}
          </div>
        </div>
      )}

      {poll.type === 'private' && (
        <div className="voters-section">
          <p className="private-vote-note">🔒 私密投票，不公开具体投票人身份</p>
        </div>
      )}

      <div className="comments-section">
        <h3 className="section-title">评论 ({comments.length})</h3>

        {user ? (
          <form onSubmit={handleSubmitComment} className="comment-form">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="发表您的评论..."
              maxLength={200}
              rows={3}
            />
            <div className="comment-form-footer">
              <span className="char-count">{commentText.length}/200</span>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={!commentText.trim() || commentLoading}
              >
                {commentLoading ? '发表中...' : '发表'}
              </button>
            </div>
          </form>
        ) : (
          <p className="login-hint">请先登录后发表评论</p>
        )}

        <div className="comments-list">
          {comments.length === 0 ? (
            <p className="no-comments">暂无评论，快来发表第一条评论吧～</p>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <div className="comment-avatar">
                  {comment.user ? getInitials(comment.user.nickname) : '?'}
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-author">
                      {comment.user?.nickname || '匿名用户'}
                    </span>
                    <RelativeTime date={comment.createdAt} className="comment-time" />
                  </div>
                  <p className="comment-text">{comment.content}</p>
                  <button
                    className={`like-btn ${comment.isLiked ? 'liked' : ''}`}
                    onClick={() => handleLikeComment(comment._id)}
                  >
                    {comment.isLiked ? '❤️' : '🤍'} {comment.likes}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PollDetailPage;
