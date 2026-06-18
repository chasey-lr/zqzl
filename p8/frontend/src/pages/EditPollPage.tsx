import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useError } from '../context/ErrorContext';
import { Poll } from '../types';

interface EditOption {
  optionId?: string;
  text: string;
  votes: number;
  color: string;
}

const EditPollPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<EditOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showError } = useError();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const response = await api.get<Poll>(`/polls/${id}`);
        const poll = response.data;
        setTitle(poll.title);
        setDescription(poll.description);
        setOptions(poll.options.map(o => ({
          optionId: o.optionId,
          text: o.text,
          votes: o.votes,
          color: o.color
        })));
      } catch (err: any) {
        showError(err.response?.data?.message || '获取投票信息失败');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [id, navigate, showError]);

  const addOption = () => {
    if (options.length < 8) {
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
      setOptions([...options, {
        text: '',
        votes: 0,
        color: colors[Math.floor(Math.random() * colors.length)]
      }]);
    }
  };

  const removeOption = (optionId: string | undefined) => {
    if (!optionId) {
      setOptions(options.filter(o => o.optionId !== optionId));
      return;
    }
    const target = options.find(o => o.optionId === optionId);
    if (target && target.votes > 0) {
      showError('已有人投票的选项不可删除');
      return;
    }
    if (options.length > 2) {
      setOptions(options.filter(o => o.optionId !== optionId));
    }
  };

  const updateOption = (optionId: string | undefined, value: string) => {
    setOptions(options.map(o =>
      o.optionId === optionId ? { ...o, text: value } : o
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validOptions = options.filter(o => o.text.trim().length > 0);
    if (validOptions.length < 2) {
      showError('至少需要2个有效选项');
      return;
    }

    if (title.trim().length === 0) {
      showError('请输入投票主题');
      return;
    }

    for (const opt of options) {
      if (opt.optionId && opt.votes > 0 && !opt.text.trim()) {
        showError('已有人投票的选项文本不能为空');
        return;
      }
    }

    setSaving(true);

    try {
      await api.put(`/polls/${id}`, {
        title: title.trim(),
        description: description.trim(),
        options: validOptions.map(o => ({
          optionId: o.optionId,
          text: o.text.trim()
        })),
      });
      navigate(`/poll/${id}`);
    } catch (err: any) {
      showError(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="create-poll-page">
      <div className="page-header">
        <h1 className="page-title">编辑投票</h1>
      </div>

      <form onSubmit={handleSubmit} className="create-poll-form">
        <div className="form-section">
          <label className="form-label">
            投票主题 <span className="required">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入投票主题（最多60字）"
            maxLength={60}
            className="form-input"
          />
          <span className="char-count">{title.length}/60</span>
        </div>

        <div className="form-section">
          <label className="form-label">描述（可选）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入投票描述"
            rows={3}
            className="form-textarea"
          />
        </div>

        <div className="form-section">
          <label className="form-label">
            选项 <span className="required">*</span>
            <span className="form-hint">（至少2个，最多8个，每个选项最多30字）</span>
          </label>
          <p className="form-warning">
            注意：已有票数的选项只能修改文本，不能删除
          </p>
          <div className="options-list">
            {options.map((option) => (
              <div key={option.optionId || `new-${Math.random()}`} className="option-item">
                <div
                  className="option-color-dot"
                  style={{ backgroundColor: option.color }}
                />
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(option.optionId, e.target.value)}
                  placeholder="选项文本"
                  maxLength={30}
                  className="form-input option-input"
                />
                {option.votes > 0 && (
                  <span className="votes-badge">
                    {option.votes}票
                  </span>
                )}
                {option.votes === 0 && options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(option.optionId)}
                    className="btn-remove"
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 8 && (
            <button type="button" onClick={addOption} className="btn-add">
              + 添加选项
            </button>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPollPage;
