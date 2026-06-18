const express = require('express');
const { runAsync, getAsync, allAsync } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const getClientIdentifier = (req) => {
  const surveyId = req.body?.survey_id || req.params?.surveyId || '';
  const ip = req.headers['x-forwarded-for'] ||
             req.headers['x-real-ip'] ||
             (req.connection && req.connection.remoteAddress) ||
             (req.socket && req.socket.remoteAddress) ||
             'unknown';

  const cookieId = req.cookies ? req.cookies[`survey_${surveyId}`] : null;

  return { ip: String(ip), cookieId };
};

router.post('/submit', async (req, res) => {
  const { survey_id, answers } = req.body;

  if (!survey_id) {
    return res.status(400).json({ error: '缺少问卷ID' });
  }

  try {
    const survey = await getAsync('SELECT * FROM surveys WHERE id = ?', [survey_id]);
    if (!survey) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    if (survey.status !== 'open') {
      return res.status(403).json({ error: '问卷未开放或已关闭' });
    }

    if (survey.deadline) {
      const now = new Date();
      const deadline = new Date(survey.deadline);
      if (now > deadline) {
        return res.status(403).json({ error: '问卷已过截止日期' });
      }
    }

    const questions = await allAsync(
      'SELECT * FROM questions WHERE survey_id = ? ORDER BY sort_order ASC, id ASC',
      [survey_id]
    );

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: '回答数据格式错误' });
    }

    for (const q of questions) {
      if (q.required) {
        const userAnswer = answers.find(a => a.question_id === q.id);
        if (!userAnswer) {
          return res.status(400).json({
            error: `请完成必答题：${q.title}`,
            questionId: q.id
          });
        }
        if (q.type === 'text') {
          if (!userAnswer.answer || userAnswer.answer.trim() === '') {
            return res.status(400).json({
              error: `请填写必答题：${q.title}`,
              questionId: q.id
            });
          }
        } else if (q.type === 'single') {
          if (!userAnswer.answer) {
            return res.status(400).json({
              error: `请完成必答题：${q.title}`,
              questionId: q.id
            });
          }
        } else if (q.type === 'multiple') {
          let selected = [];
          try {
            selected = JSON.parse(userAnswer.answer);
          } catch (e) {
            selected = [];
          }
          if (!Array.isArray(selected) || selected.length === 0) {
            return res.status(400).json({
              error: `请完成必答题：${q.title}`,
              questionId: q.id
            });
          }
        }
      }
    }

    const { ip, cookieId } = getClientIdentifier(req);

    const existingByIP = await getAsync(
      'SELECT id FROM responses WHERE survey_id = ? AND ip_address = ?',
      [survey_id, ip]
    );

    if (existingByIP) {
      return res.status(403).json({ error: '您已提交过此问卷' });
    }

    if (cookieId) {
      const existingByCookie = await getAsync(
        'SELECT id FROM responses WHERE survey_id = ? AND cookie_id = ?',
        [survey_id, cookieId]
      );
      if (existingByCookie) {
        return res.status(403).json({ error: '您已提交过此问卷' });
      }
    }

    const newCookieId = `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const insertResponse = await runAsync(
      'INSERT INTO responses (survey_id, ip_address, cookie_id) VALUES (?, ?, ?)',
      [survey_id, ip, newCookieId]
    );
    const responseId = insertResponse.lastID;

    for (const a of answers) {
      await runAsync(
        'INSERT INTO answers (response_id, question_id, answer) VALUES (?, ?, ?)',
        [responseId, a.question_id, a.answer || null]
      );
    }

    res.cookie(`survey_${survey_id}`, newCookieId, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true
    });

    res.json({ message: '提交成功，感谢参与！' });
  } catch (err) {
    console.error('Submit response error:', err);
    res.status(500).json({ error: '提交失败，请重试' });
  }
});

router.get('/check/:surveyId', async (req, res) => {
  const { surveyId } = req.params;
  const { ip } = getClientIdentifier(req);
  const cookieId = req.cookies ? req.cookies[`survey_${surveyId}`] : null;

  let submitted = false;

  try {
    const byIP = await getAsync(
      'SELECT id FROM responses WHERE survey_id = ? AND ip_address = ?',
      [surveyId, ip]
    );
    if (byIP) submitted = true;

    if (!submitted && cookieId) {
      const byCookie = await getAsync(
        'SELECT id FROM responses WHERE survey_id = ? AND cookie_id = ?',
        [surveyId, cookieId]
      );
      if (byCookie) submitted = true;
    }

    res.json({ submitted });
  } catch (err) {
    console.error('Check submission error:', err);
    res.status(500).json({ error: '检查失败' });
  }
});

router.get('/stats/:surveyId', authenticate, async (req, res) => {
  try {
    const survey = await getAsync(`
      SELECT s.*, u.email as creator_email
      FROM surveys s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.user_id = ?
    `, [req.params.surveyId, req.user.id]);

    if (!survey) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    const questions = await allAsync(
      'SELECT * FROM questions WHERE survey_id = ? ORDER BY sort_order ASC, id ASC',
      [survey.id]
    );

    const { total } = await getAsync(
      'SELECT COUNT(*) as total FROM responses WHERE survey_id = ?',
      [survey.id]
    );

    const stats = {
      survey: {
        id: survey.id,
        title: survey.title,
        description: survey.description,
        status: survey.status,
        created_at: survey.created_at,
        published_at: survey.published_at,
        closed_at: survey.closed_at,
        deadline: survey.deadline
      },
      totalResponses: total,
      questionStats: []
    };

    for (const q of questions) {
      const qStat = {
        questionId: q.id,
        type: q.type,
        title: q.title,
        required: Boolean(q.required)
      };

      if (q.type === 'single' || q.type === 'multiple') {
        const options = JSON.parse(q.options || '[]');
        qStat.options = options.map(opt => ({
          label: opt,
          count: 0,
          percentage: 0
        }));

        const rows = await allAsync(
          'SELECT answer FROM answers WHERE question_id = ?',
          [q.id]
        );

        if (q.type === 'single') {
          for (const row of rows) {
            const idx = qStat.options.findIndex(o => o.label === row.answer);
            if (idx !== -1) qStat.options[idx].count++;
          }
        } else {
          for (const row of rows) {
            try {
              const selected = JSON.parse(row.answer);
              if (Array.isArray(selected)) {
                for (const sel of selected) {
                  const idx = qStat.options.findIndex(o => o.label === sel);
                  if (idx !== -1) qStat.options[idx].count++;
                }
              }
            } catch (e) {}
          }
        }

        if (total > 0) {
          for (const opt of qStat.options) {
            opt.percentage = Math.round((opt.count / total) * 100);
          }
        }
      } else if (q.type === 'text') {
        const rows = await allAsync(`
          SELECT answer, r.created_at FROM answers a
          JOIN responses r ON a.response_id = r.id
          WHERE a.question_id = ?
          ORDER BY r.created_at ASC
        `, [q.id]);

        qStat.textAnswers = rows
          .filter(r => r.answer && r.answer.trim() !== '')
          .map((r, i) => ({
            index: i + 1,
            content: r.answer,
            created_at: r.created_at
          }));
      }

      stats.questionStats.push(qStat);
    }

    res.json(stats);
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: '获取统计失败' });
  }
});

module.exports = router;
