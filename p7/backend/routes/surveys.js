const express = require('express');
const { runAsync, getAsync, allAsync } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const SENSITIVE_WORDS = ['测试', 'demo', 'Demo', 'DEMO', 'test', 'Test', 'TEST'];

const processTitle = (title) => {
  for (const word of SENSITIVE_WORDS) {
    if (title.includes(word)) {
      if (!title.endsWith('(示例)')) {
        return title + '(示例)';
      }
      return title;
    }
  }
  return title;
};

const attachQuestions = async (survey) => {
  const questions = await allAsync(
    'SELECT * FROM questions WHERE survey_id = ? ORDER BY sort_order ASC, id ASC',
    [survey.id]
  );
  survey.questions = questions.map(q => ({
    ...q,
    options: q.options ? JSON.parse(q.options) : [],
    required: Boolean(q.required)
  }));
  return survey;
};

router.get('/', authenticate, async (req, res) => {
  const { status, search, page = 1, pageSize = 5 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  let sql = `
    SELECT s.*, COALESCE(rc.response_count, 0) as response_count
    FROM surveys s
    LEFT JOIN (
      SELECT survey_id, COUNT(*) as response_count
      FROM responses
      GROUP BY survey_id
    ) rc ON s.id = rc.survey_id
    WHERE s.user_id = ?
  `;
  const params = [req.user.id];

  if (status && status !== 'all') {
    sql += ' AND s.status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND s.title LIKE ?';
    params.push(`%${search}%`);
  }

  sql += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(pageSize), offset);

  try {
    const surveys = await allAsync(sql, params);

    let countSql = 'SELECT COUNT(*) as total FROM surveys s WHERE s.user_id = ?';
    const countParams = [req.user.id];

    if (status && status !== 'all') {
      countSql += ' AND s.status = ?';
      countParams.push(status);
    }

    if (search) {
      countSql += ' AND s.title LIKE ?';
      countParams.push(`%${search}%`);
    }

    const { total } = await getAsync(countSql, countParams);

    res.json({
      surveys,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)) || 1
      }
    });
  } catch (err) {
    console.error('Get surveys error:', err);
    res.status(500).json({ error: '获取问卷列表失败' });
  }
});

router.get('/public', async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const sql = `
    SELECT s.id, s.title, s.description, s.status, s.created_at, s.published_at,
           u.email as creator_email,
           COALESCE(rc.response_count, 0) as response_count
    FROM surveys s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN (
      SELECT survey_id, COUNT(*) as response_count
      FROM responses
      GROUP BY survey_id
    ) rc ON s.id = rc.survey_id
    WHERE s.status = 'open'
    ORDER BY s.published_at DESC
    LIMIT ? OFFSET ?
  `;

  try {
    const surveys = await allAsync(sql, [Number(pageSize), offset]);

    const { total } = await getAsync('SELECT COUNT(*) as total FROM surveys WHERE status = ?', ['open']);

    res.json({
      surveys,
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        totalPages: Math.ceil(total / Number(pageSize)) || 1
      }
    });
  } catch (err) {
    console.error('Get public surveys error:', err);
    res.status(500).json({ error: '获取公开问卷失败' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const survey = await getAsync(
      'SELECT * FROM surveys WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!survey) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    await attachQuestions(survey);
    res.json(survey);
  } catch (err) {
    console.error('Get survey error:', err);
    res.status(500).json({ error: '获取问卷详情失败' });
  }
});

router.get('/fill/:id', async (req, res) => {
  try {
    const survey = await getAsync(`
      SELECT s.*, u.email as creator_email
      FROM surveys s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [req.params.id]);

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

    await attachQuestions(survey);
    res.json(survey);
  } catch (err) {
    console.error('Get fill survey error:', err);
    res.status(500).json({ error: '获取问卷失败' });
  }
});

router.post('/', authenticate, async (req, res) => {
  const { title, description, deadline, questions } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: '问卷标题不能为空' });
  }

  if (title.length > 80) {
    return res.status(400).json({ error: '问卷标题不能超过80字' });
  }

  const processedTitle = processTitle(title.trim());

  try {
    const result = await runAsync(
      'INSERT INTO surveys (user_id, title, description, deadline) VALUES (?, ?, ?, ?)',
      [req.user.id, processedTitle, description || null, deadline || null]
    );
    const surveyId = result.lastID;

    if (Array.isArray(questions) && questions.length > 0) {
      const insertQuestion = `
        INSERT INTO questions (survey_id, type, title, required, sort_order, options)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      for (let idx = 0; idx < questions.length; idx++) {
        const q = questions[idx];
        if (!q.title || q.title.trim().length === 0) {
          await runAsync('DELETE FROM surveys WHERE id = ?', [surveyId]);
          return res.status(400).json({ error: `第${idx + 1}题的标题不能为空` });
        }
        if (!['single', 'multiple', 'text'].includes(q.type)) {
          await runAsync('DELETE FROM surveys WHERE id = ?', [surveyId]);
          return res.status(400).json({ error: `第${idx + 1}题的类型不正确` });
        }
        if (q.type === 'single' || q.type === 'multiple') {
          if (!Array.isArray(q.options) || q.options.length < 2) {
            await runAsync('DELETE FROM surveys WHERE id = ?', [surveyId]);
            return res.status(400).json({ error: `第${idx + 1}题至少需要2个选项` });
          }
        }

        await runAsync(insertQuestion, [
          surveyId,
          q.type,
          q.title.trim(),
          q.required ? 1 : 0,
          q.sort_order ?? idx,
          JSON.stringify(q.options || [])
        ]);
      }
    }

    const newSurvey = await getAsync('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    await attachQuestions(newSurvey);

    res.status(201).json({
      message: '问卷创建成功',
      survey: newSurvey
    });
  } catch (err) {
    console.error('Create survey error:', err);
    res.status(500).json({ error: '创建问卷失败' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  try {
    const survey = await getAsync(
      'SELECT * FROM surveys WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!survey) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    if (survey.status !== 'draft') {
      return res.status(400).json({ error: '只能编辑草稿状态的问卷' });
    }

    const { title, description, deadline, questions } = req.body;

    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return res.status(400).json({ error: '问卷标题不能为空' });
      }
      if (title.length > 80) {
        return res.status(400).json({ error: '问卷标题不能超过80字' });
      }
    }

    await runAsync(
      'UPDATE surveys SET title = ?, description = ?, deadline = ? WHERE id = ?',
      [
        title ? title.trim() : survey.title,
        description !== undefined ? description : survey.description,
        deadline !== undefined ? deadline : survey.deadline,
        survey.id
      ]
    );

    if (Array.isArray(questions)) {
      await runAsync('DELETE FROM questions WHERE survey_id = ?', [survey.id]);

      const insertQuestion = `
        INSERT INTO questions (survey_id, type, title, required, sort_order, options)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      for (let idx = 0; idx < questions.length; idx++) {
        const q = questions[idx];
        if (!q.title || q.title.trim().length === 0) {
          return res.status(400).json({ error: `第${idx + 1}题的标题不能为空` });
        }
        if (!['single', 'multiple', 'text'].includes(q.type)) {
          return res.status(400).json({ error: `第${idx + 1}题的类型不正确` });
        }
        if (q.type === 'single' || q.type === 'multiple') {
          if (!Array.isArray(q.options) || q.options.length < 2) {
            return res.status(400).json({ error: `第${idx + 1}题至少需要2个选项` });
          }
        }

        await runAsync(insertQuestion, [
          survey.id,
          q.type,
          q.title.trim(),
          q.required ? 1 : 0,
          q.sort_order ?? idx,
          JSON.stringify(q.options || [])
        ]);
      }
    }

    const updatedSurvey = await getAsync('SELECT * FROM surveys WHERE id = ?', [survey.id]);
    await attachQuestions(updatedSurvey);

    res.json({
      message: '问卷更新成功',
      survey: updatedSurvey
    });
  } catch (err) {
    console.error('Update survey error:', err);
    res.status(500).json({ error: '更新问卷失败' });
  }
});

router.post('/:id/publish', authenticate, async (req, res) => {
  try {
    const survey = await getAsync(
      'SELECT * FROM surveys WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!survey) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    if (survey.status !== 'draft') {
      return res.status(400).json({ error: '只能发布草稿状态的问卷' });
    }

    const { cnt } = await getAsync('SELECT COUNT(*) as cnt FROM questions WHERE survey_id = ?', [survey.id]);
    if (cnt === 0) {
      return res.status(400).json({ error: '问卷至少需要一个问题才能发布' });
    }

    await runAsync(
      "UPDATE surveys SET status = 'open', published_at = CURRENT_TIMESTAMP WHERE id = ?",
      [survey.id]
    );

    const updated = await getAsync('SELECT * FROM surveys WHERE id = ?', [survey.id]);

    res.json({
      message: '问卷发布成功',
      survey: updated,
      fillLink: `/fill/${survey.id}`
    });
  } catch (err) {
    console.error('Publish survey error:', err);
    res.status(500).json({ error: '发布问卷失败' });
  }
});

router.post('/:id/close', authenticate, async (req, res) => {
  try {
    const survey = await getAsync(
      'SELECT * FROM surveys WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!survey) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    if (survey.status !== 'open') {
      return res.status(400).json({ error: '只能关闭开放中的问卷' });
    }

    await runAsync(
      "UPDATE surveys SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE id = ?",
      [survey.id]
    );

    const updated = await getAsync('SELECT * FROM surveys WHERE id = ?', [survey.id]);

    res.json({
      message: '问卷已关闭',
      survey: updated
    });
  } catch (err) {
    console.error('Close survey error:', err);
    res.status(500).json({ error: '关闭问卷失败' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const survey = await getAsync(
      'SELECT * FROM surveys WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!survey) {
      return res.status(404).json({ error: '问卷不存在' });
    }

    await runAsync('DELETE FROM answers WHERE response_id IN (SELECT id FROM responses WHERE survey_id = ?)', [survey.id]);
    await runAsync('DELETE FROM responses WHERE survey_id = ?', [survey.id]);
    await runAsync('DELETE FROM questions WHERE survey_id = ?', [survey.id]);
    await runAsync('DELETE FROM surveys WHERE id = ?', [survey.id]);

    res.json({ message: '问卷删除成功' });
  } catch (err) {
    console.error('Delete survey error:', err);
    res.status(500).json({ error: '删除问卷失败' });
  }
});

module.exports = router;
