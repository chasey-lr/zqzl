import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';

const FillSurvey = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const questionRefs = useRef({});

  const fetchSurvey = useCallback(async () => {
    setLoading(true);
    try {
      const checkRes = await api.get(`/responses/check/${id}`);
      if (checkRes.submitted) {
        setAlreadySubmitted(true);
      }

      const data = await api.get(`/surveys/fill/${id}`);
      setSurvey(data);
      const initial = {};
      data.questions.forEach(q => {
        if (q.type === 'multiple') initial[q.id] = [];
        else initial[q.id] = '';
      });
      setAnswers(initial);
    } catch (err) {
      if (err.response) {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSurvey();
  }, [fetchSurvey]);

  const handleSingleSelect = (qid, option) => {
    setAnswers(prev => ({ ...prev, [qid]: option }));
    if (errors[qid]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[qid];
        return next;
      });
    }
  };

  const handleMultipleSelect = (qid, option) => {
    setAnswers(prev => {
      const current = prev[qid] || [];
      const exists = current.includes(option);
      const updated = exists
        ? current.filter(o => o !== option)
        : [...current, option];
      return { ...prev, [qid]: updated };
    });
    if (errors[qid]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[qid];
        return next;
      });
    }
  };

  const handleTextChange = (qid, value) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
    if (errors[qid] && value.trim()) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[qid];
        return next;
      });
    }
  };

  const scrollToQuestion = (qid) => {
    const el = questionRefs.current[qid];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (alreadySubmitted) return;

    const newErrors = {};
    let firstErrorId = null;

    survey.questions.forEach(q => {
      const ans = answers[q.id];
      if (q.required) {
        if (q.type === 'text') {
          if (!ans || !ans.trim()) {
            newErrors[q.id] = true;
            if (!firstErrorId) firstErrorId = q.id;
          }
        } else if (q.type === 'single') {
          if (!ans) {
            newErrors[q.id] = true;
            if (!firstErrorId) firstErrorId = q.id;
          }
        } else if (q.type === 'multiple') {
          if (!ans || ans.length === 0) {
            newErrors[q.id] = true;
            if (!firstErrorId) firstErrorId = q.id;
          }
        }
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (firstErrorId) scrollToQuestion(firstErrorId);
      return;
    }

    const payload = {
      survey_id: survey.id,
      answers: survey.questions.map(q => ({
        question_id: q.id,
        answer: q.type === 'multiple' ? JSON.stringify(answers[q.id] || []) : (answers[q.id] || '')
      }))
    };

    setSubmitting(true);
    try {
      await api.post('/responses/submit', payload);
      setSuccess(true);
      setTimeout(() => navigate('/public'), 3000);
    } catch (err) {
      if (err.message && err.message.includes('已提交')) {
        setAlreadySubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fill-page">
        <div className="loading-container card">
          <span className="spinner" style={{ color: 'var(--primary)' }}></span>
          加载中...
        </div>
      </div>
    );
  }

  if (errorMsg && !survey) {
    return (
      <div className="fill-page">
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">😕</div>
            <div className="empty-title">无法访问问卷</div>
            <div className="empty-text">{errorMsg}</div>
            <Link to="/public" className="btn btn-primary">浏览公开问卷</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  if (success) {
    return (
      <div className="fill-page">
        <div className="submitted-banner">
          <div className="submitted-icon">🎉</div>
          <div className="submitted-title">感谢参与！</div>
          <div className="submitted-text">您的回答已成功提交，3秒后自动跳转到问卷首页...</div>
          <Link to="/public" className="btn btn-primary">立即前往</Link>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="fill-page">
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">您已提交过此问卷</div>
            <div className="empty-text">感谢您的参与，每份问卷只能提交一次。</div>
            <Link to="/public" className="btn btn-primary">浏览其他问卷</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fill-page">
      <div className="fill-header">
        <h1 className="fill-title">{survey.title}</h1>
        {survey.description && (
          <p className="fill-description">{survey.description}</p>
        )}
      </div>

      <form className="fill-body" onSubmit={handleSubmit}>
        {survey.questions.map((q, idx) => (
          <div
            key={q.id}
            ref={(el) => { questionRefs.current[q.id] = el; }}
            className={`fill-question ${errors[q.id] ? 'highlight' : ''}`}
            id={`question-${q.id}`}
          >
            <div className="fill-question-title">
              <span style={{ marginRight: 4, color: 'var(--text-secondary)' }}>{idx + 1}.</span>
              <span>{q.title}</span>
              {q.required && <span className="star">*</span>}
            </div>

            {q.type === 'single' && (
              <div>
                {q.options.map((opt, i) => (
                  <label
                    key={i}
                    className={`fill-option ${answers[q.id] === opt ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      checked={answers[q.id] === opt}
                      onChange={() => handleSingleSelect(q.id, opt)}
                    />
                    <span className="fill-option-label">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'multiple' && (
              <div>
                {q.options.map((opt, i) => (
                  <label
                    key={i}
                    className={`fill-option ${(answers[q.id] || []).includes(opt) ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={(answers[q.id] || []).includes(opt)}
                      onChange={() => handleMultipleSelect(q.id, opt)}
                    />
                    <span className="fill-option-label">{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'text' && (
              <textarea
                className={`fill-textarea ${errors[q.id] ? 'error' : ''}`}
                placeholder="请输入您的回答..."
                value={answers[q.id] || ''}
                onChange={(e) => handleTextChange(q.id, e.target.value)}
              />
            )}

            {errors[q.id] && (
              <div style={{
                color: 'var(--danger)',
                fontSize: 13,
                marginTop: 8,
                fontWeight: 500
              }}>
                ⚠ 此题为必答题，请完成后再提交
              </div>
            )}
          </div>
        ))}

        <div style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: '1px solid var(--border)'
        }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={submitting}
          >
            {submitting ? (
              <><span className="spinner" style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 8 }}></span>提交中...</>
            ) : '提交问卷'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FillSurvey;
