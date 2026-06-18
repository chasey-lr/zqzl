import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getQuestionTypeText } from '../utils/helpers';
import Toast from '../components/Toast';

const createEmptyQuestion = () => ({
  id: Date.now() + Math.random(),
  type: 'single',
  title: '',
  required: false,
  sort_order: 0,
  options: ['', '']
});

const SurveyCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const fetchSurvey = useCallback(async () => {
    try {
      const data = await api.get(`/surveys/${id}`);
      setTitle(data.title);
      setDescription(data.description || '');
      if (data.deadline) {
        setHasDeadline(true);
        const d = new Date(data.deadline);
        const pad = (n) => String(n).padStart(2, '0');
        setDeadline(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      }
      setQuestions(data.questions.map(q => ({ ...q, id: q.id || Date.now() + Math.random() })));
    } catch (err) {} finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!user) navigate('/login');
    else if (isEdit) fetchSurvey();
  }, [user, navigate, isEdit, fetchSurvey]);

  const addQuestion = () => {
    const newQ = createEmptyQuestion();
    newQ.sort_order = questions.length;
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (idx, updates) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...updates };
    setQuestions(updated);
  };

  const removeQuestion = (idx) => {
    const updated = questions.filter((_, i) => i !== idx);
    updated.forEach((q, i) => q.sort_order = i);
    setQuestions(updated);
  };

  const addOption = (qIdx) => {
    const updated = [...questions];
    updated[qIdx].options = [...updated[qIdx].options, ''];
    setQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const updated = [...questions];
    updated[qIdx].options = [...updated[qIdx].options];
    updated[qIdx].options[optIdx] = value;
    setQuestions(updated);
  };

  const removeOption = (qIdx, optIdx) => {
    const updated = [...questions];
    if (updated[qIdx].options.length <= 2) return;
    updated[qIdx].options = updated[qIdx].options.filter((_, i) => i !== optIdx);
    setQuestions(updated);
  };

  const handleDragStart = (e, idx) => {
    dragItem.current = idx;
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnter = (e, idx) => {
    e.preventDefault();
    dragOverItem.current = idx;
    e.currentTarget.classList.add('drag-over');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-over');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    document.querySelectorAll('.question-editor').forEach(el => {
      el.classList.remove('dragging', 'drag-over');
    });

    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === null || to === null || from === to) return;

    const updated = [...questions];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    updated.forEach((q, i) => q.sort_order = i);
    setQuestions(updated);

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.question-editor').forEach(el => {
      el.classList.remove('drag-over');
    });
  };

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = '请输入问卷标题';
    else if (title.length > 80) errs.title = '标题不能超过80字';

    if (questions.length === 0) {
      errs.questions = '至少添加一个问题';
    }

    questions.forEach((q, idx) => {
      if (!q.title.trim()) {
        errs[`q_${idx}_title`] = '请输入问题标题';
      }
      if ((q.type === 'single' || q.type === 'multiple')) {
        const validOpts = q.options.filter(o => o.trim());
        if (validOpts.length < 2) {
          errs[`q_${idx}_options`] = '至少需要2个有效选项';
        }
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        deadline: hasDeadline ? new Date(deadline).toISOString() : null,
        questions: questions.map((q, i) => ({
          ...q,
          sort_order: i,
          title: q.title.trim(),
          options: (q.type === 'single' || q.type === 'multiple')
            ? q.options.filter(o => o.trim()).map(o => o.trim())
            : []
        }))
      };

      if (isEdit) {
        await api.put(`/surveys/${id}`, payload);
      } else {
        await api.post('/surveys', payload);
      }

      setToast({ message: isEdit ? '问卷保存成功' : '问卷创建成功', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {} finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content container">
        <div className="loading-container">
          <span className="spinner" style={{ color: 'var(--primary)' }}></span>
          加载中...
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="main-content container">
        <div className="page-header">
          <h1 className="page-title">{isEdit ? '编辑问卷' : '创建新问卷'}</h1>
          <p className="page-subtitle">
            填写问卷信息并添加问题。支持拖拽调整问题顺序。
          </p>
        </div>

        <form onSubmit={handleSave}>
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>基本信息</h2>

            <div className="form-group">
              <label className="form-label">问卷标题 <span className="required">*</span></label>
              <input
                type="text"
                className={`form-input ${errors.title ? 'error' : ''}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入问卷标题（最多80字）"
                maxLength={80}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                {errors.title && <span className="form-error">{errors.title}</span>}
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {title.length}/80
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                提示：如果标题包含"测试"、"demo"等敏感词，将自动追加"(示例)"后缀，您可手动删除。
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">问卷描述</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="可选：填写问卷说明或介绍..."
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <input
                  type="checkbox"
                  id="deadlineToggle"
                  checked={hasDeadline}
                  onChange={(e) => setHasDeadline(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                />
                <label htmlFor="deadlineToggle" style={{ fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  设置截止日期
                </label>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  （不设置则永久有效）
                </span>
              </div>
              {hasDeadline && (
                <input
                  type="datetime-local"
                  className="form-input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </div>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>问题列表</h2>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addQuestion}>
                + 添加问题
              </button>
            </div>

            {errors.questions && (
              <div style={{
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: 20
              }}>
                {errors.questions}
              </div>
            )}

            {questions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">❓</div>
                <div className="empty-title">还没有问题</div>
                <div className="empty-text">点击上方"添加问题"按钮开始添加</div>
              </div>
            ) : (
              <div>
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="question-editor"
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragEnter={(e) => handleDragEnter(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="question-header">
                      <div className="drag-handle" title="拖拽调整顺序">
                        <span style={{ fontSize: 18 }}>⠿</span>
                      </div>
                      <span className="question-number">Q{idx + 1}.</span>
                      <select
                        className="form-select question-type-select"
                        value={q.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          updateQuestion(idx, {
                            type: newType,
                            options: (newType === 'text') ? [] : (q.options.length >= 2 ? q.options : ['', ''])
                          });
                        }}
                      >
                        <option value="single">单选题</option>
                        <option value="multiple">多选题</option>
                        <option value="text">文本题</option>
                      </select>
                      <label className="required-toggle">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(idx, { required: e.target.checked })}
                          style={{ width: 16, height: 16, accentColor: 'var(--primary)' }}
                        />
                        必答
                      </label>
                      <button
                        type="button"
                        className="delete-question-btn"
                        onClick={() => removeQuestion(idx)}
                        title="删除问题"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="question-body">
                      <div className="form-group">
                        <input
                          type="text"
                          className={`form-input ${errors[`q_${idx}_title`] ? 'error' : ''}`}
                          value={q.title}
                          onChange={(e) => updateQuestion(idx, { title: e.target.value })}
                          placeholder={`请输入${getQuestionTypeText(q.type)}标题`}
                        />
                        {errors[`q_${idx}_title`] && (
                          <span className="form-error">{errors[`q_${idx}_title`]}</span>
                        )}
                      </div>

                      {(q.type === 'single' || q.type === 'multiple') && (
                        <div style={{ marginTop: 12 }}>
                          {q.options.map((opt, optIdx) => (
                            <div className="option-item" key={optIdx}>
                              <span style={{
                                width: 24, height: 24,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: q.type === 'single' ? '50%' : 4,
                                border: '1px solid var(--border)',
                                fontSize: 12,
                                color: 'var(--text-secondary)',
                                flexShrink: 0
                              }}>
                                {q.type === 'single'
                                  ? String.fromCharCode(65 + optIdx)
                                  : '☐'
                                }
                              </span>
                              <input
                                type="text"
                                className="form-input option-input"
                                value={opt}
                                onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                                placeholder={`选项${String.fromCharCode(65 + optIdx)}`}
                              />
                              <button
                                type="button"
                                className="remove-option-btn"
                                onClick={() => removeOption(idx, optIdx)}
                                title="删除选项"
                                disabled={q.options.length <= 2}
                                style={{ opacity: q.options.length <= 2 ? 0.3 : 1 }}
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          {errors[`q_${idx}_options`] && (
                            <span className="form-error" style={{ display: 'block', marginTop: 4 }}>
                              {errors[`q_${idx}_options`]}
                            </span>
                          )}

                          <button
                            type="button"
                            className="add-option-btn"
                            onClick={() => addOption(idx)}
                          >
                            + 添加选项
                          </button>
                        </div>
                      )}

                      {q.type === 'text' && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                          用户将在此输入自由文本回答
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/dashboard')}
                disabled={saving}
              >
                取消
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addQuestion}
                disabled={saving}
              >
                + 添加问题
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <><span className="spinner" style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 8 }}></span>保存中...</>
                ) : (isEdit ? '保存修改' : '创建问卷')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default SurveyCreate;
