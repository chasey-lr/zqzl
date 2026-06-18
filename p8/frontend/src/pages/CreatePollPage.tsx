import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useError } from '../context/ErrorContext';
import { generateRandomColor } from '../utils/date';

interface OptionEntry {
  text: string;
  color: string;
}

const CreatePollPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<OptionEntry[]>([
    { text: '', color: generateRandomColor() },
    { text: '', color: generateRandomColor() }
  ]);
  const [type, setType] = useState<'public' | 'private'>('public');
  const [invitedEmails, setInvitedEmails] = useState<string[]>(['']);
  const [deadline, setDeadline] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 16);
  });
  const [loading, setLoading] = useState(false);
  const { showError } = useError();
  const navigate = useNavigate();

  const addOption = () => {
    if (options.length < 8) {
      setOptions([...options, { text: '', color: generateRandomColor() }]);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text: value };
    setOptions(newOptions);
  };

  const addEmail = () => {
    if (invitedEmails.length < 50) {
      setInvitedEmails([...invitedEmails, '']);
    }
  };

  const removeEmail = (index: number) => {
    setInvitedEmails(invitedEmails.filter((_, i) => i !== index));
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...invitedEmails];
    newEmails[index] = value;
    setInvitedEmails(newEmails);
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

    setLoading(true);

    try {
      const pollData: any = {
        title: title.trim(),
        description: description.trim(),
        options: validOptions.map(o => o.text),
        type,
        deadline: new Date(deadline).toISOString(),
      };

      if (type === 'private') {
        const validEmails = invitedEmails.filter(e => e.trim().length > 0);
        pollData.invitedEmails = validEmails;
      }

      const response = await api.post('/polls', pollData);
      navigate(`/poll/${response.data._id}`);
    } catch (err: any) {
      showError(err.response?.data?.message || '创建投票失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-poll-page">
      <div className="page-header">
        <h1 className="page-title">创建新投票</h1>
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
          <div className="options-list">
            {options.map((option, index) => (
              <div key={index} className="option-item">
                <div
                  className="option-color-dot"
                  style={{ backgroundColor: option.color }}
                />
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`选项 ${index + 1}`}
                  maxLength={30}
                  className="form-input option-input"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
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

        <div className="form-section">
          <label className="form-label">投票类型</label>
          <div className="type-selector">
            <label className={`type-option ${type === 'public' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="public"
                checked={type === 'public'}
                onChange={() => setType('public')}
              />
              <div className="type-option-content">
                <span className="type-icon">🌐</span>
                <div>
                  <span className="type-name">公开投票</span>
                  <p className="type-desc">所有人可见并可参与投票</p>
                </div>
              </div>
            </label>
            <label className={`type-option ${type === 'private' ? 'selected' : ''}`}>
              <input
                type="radio"
                value="private"
                checked={type === 'private'}
                onChange={() => setType('private')}
              />
              <div className="type-option-content">
                <span className="type-icon">🔒</span>
                <div>
                  <span className="type-name">私密投票</span>
                  <p className="type-desc">仅受邀用户可以查看和参与</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {type === 'private' && (
          <div className="form-section">
            <label className="form-label">受邀用户邮箱</label>
            <div className="emails-list">
              {invitedEmails.map((email, index) => (
                <div key={index} className="email-item">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    placeholder="请输入受邀用户邮箱"
                    className="form-input email-input"
                  />
                  {invitedEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmail(index)}
                      className="btn-remove"
                    >
                      删除
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addEmail} className="btn-add">
              + 添加邮箱
            </button>
          </div>
        )}

        <div className="form-section">
          <label className="form-label">截止日期（可选）</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="form-input"
          />
          <p className="form-hint">默认7天后截止</p>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '创建中...' : '创建投票'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePollPage;
