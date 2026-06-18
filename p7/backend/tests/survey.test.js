require('dotenv').config();

process.env.DB_PATH = './data/test.db';
process.env.JWT_SECRET = 'test_secret_key';

const request = require('supertest');
const fs = require('fs');
const path = require('path');

const { startServer } = require('../server');
const { close, saveDB, execAsync } = require('../db');

let app;
let authToken;
let userId;

beforeAll(async () => {
  const testDbPath = path.join(__dirname, '..', 'data', 'test.db');
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch(e) {}
  }

  jest.setTimeout(30000);
  await startServer();
  const serverModule = require('../server');
  app = serverModule.app;

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'test@example.com', password: 'password123' });

  authToken = res.body.token;
  userId = res.body.user.id;
});

afterAll(async () => {
  saveDB();
  await new Promise(resolve => setTimeout(resolve, 100));
  close();

  const testDbPath = path.join(__dirname, '..', 'data', 'test.db');
  await new Promise(resolve => setTimeout(resolve, 200));
  if (fs.existsSync(testDbPath)) {
    try { fs.unlinkSync(testDbPath); } catch(e) {}
  }
}, 10000);

describe('POST /api/surveys - 创建问卷', () => {
  it('成功创建带问题的问卷', async () => {
    const res = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '用户满意度调查',
        description: '关于产品使用的满意度问卷',
        questions: [
          {
            type: 'single',
            title: '您的年龄段',
            required: true,
            sort_order: 0,
            options: ['18岁以下', '18-30岁', '31-50岁', '50岁以上']
          },
          {
            type: 'multiple',
            title: '您常用的功能',
            required: true,
            sort_order: 1,
            options: ['数据统计', '报告导出', '团队协作', '消息通知']
          },
          {
            type: 'text',
            title: '您的建议',
            required: false,
            sort_order: 2,
            options: []
          }
        ]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.survey).toBeDefined();
    expect(res.body.survey.title).toBe('用户满意度调查');
    expect(res.body.survey.status).toBe('draft');
    expect(res.body.survey.questions.length).toBe(3);
    expect(res.body.survey.questions[0].type).toBe('single');
    expect(res.body.survey.questions[0].options.length).toBe(4);
  });

  it('敏感词自动追加(示例)后缀', async () => {
    const res = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '测试问卷',
        description: '',
        questions: [
          {
            type: 'text',
            title: '简单问题',
            required: false,
            sort_order: 0,
            options: []
          }
        ]
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.survey.title).toBe('测试问卷(示例)');
  });

  it('标题为空返回400错误', async () => {
    const res = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: '', questions: [] });

    expect(res.statusCode).toBe(400);
  });

  it('标题超过80字返回400错误', async () => {
    const res = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'A'.repeat(85),
        questions: []
      });

    expect(res.statusCode).toBe(400);
  });

  it('未登录返回401', async () => {
    const res = await request(app)
      .post('/api/surveys')
      .send({ title: '未登录问卷', questions: [] });

    expect(res.statusCode).toBe(401);
  });

  it('选择题选项不足2个返回400', async () => {
    const res = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '单选测试',
        questions: [
          {
            type: 'single',
            title: '单选题',
            required: true,
            sort_order: 0,
            options: ['选项1']
          }
        ]
      });

    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/responses/submit - 提交回答', () => {
  let surveyId;
  let qids;

  beforeAll(async () => {
    const surveyRes = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '提交测试问卷',
        description: '用于测试提交功能',
        questions: [
          {
            type: 'single',
            title: '最喜欢的颜色',
            required: true,
            sort_order: 0,
            options: ['红色', '蓝色', '绿色']
          },
          {
            type: 'multiple',
            title: '喜欢的运动',
            required: true,
            sort_order: 1,
            options: ['篮球', '足球', '游泳', '跑步']
          },
          {
            type: 'text',
            title: '补充说明',
            required: false,
            sort_order: 2,
            options: []
          }
        ]
      });

    surveyId = surveyRes.body.survey.id;

    await request(app)
      .post(`/api/surveys/${surveyId}/publish`)
      .set('Authorization', `Bearer ${authToken}`);

    const fillRes = await request(app).get(`/api/surveys/fill/${surveyId}`);
    qids = fillRes.body.questions.map(q => q.id);
  });

  it('成功提交完整问卷', async () => {
    const res = await request(app)
      .post('/api/responses/submit')
      .set('X-Forwarded-For', '10.0.0.100')
      .send({
        survey_id: surveyId,
        answers: [
          { question_id: qids[0], answer: '红色' },
          { question_id: qids[1], answer: JSON.stringify(['篮球', '游泳']) },
          { question_id: qids[2], answer: '测试文本回答' }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('成功');
  });

  it('必答单选题未填返回400', async () => {
    const res = await request(app)
      .post('/api/responses/submit')
      .set('X-Forwarded-For', '1.2.3.50')
      .send({
        survey_id: surveyId,
        answers: [
          { question_id: qids[1], answer: JSON.stringify(['足球']) }
        ]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('必答题');
  });

  it('必答多选题未选返回400', async () => {
    const res = await request(app)
      .post('/api/responses/submit')
      .set('X-Forwarded-For', '1.2.3.60')
      .send({
        survey_id: surveyId,
        answers: [
          { question_id: qids[0], answer: '蓝色' },
          { question_id: qids[1], answer: JSON.stringify([]) }
        ]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('必答题');
  });

  it('同一IP重复提交返回403', async () => {
    await request(app)
      .post('/api/responses/submit')
      .set('X-Forwarded-For', '127.0.0.20')
      .send({
        survey_id: surveyId,
        answers: [
          { question_id: qids[0], answer: '绿色' },
          { question_id: qids[1], answer: JSON.stringify(['跑步']) }
        ]
      });

    const res = await request(app)
      .post('/api/responses/submit')
      .set('X-Forwarded-For', '127.0.0.20')
      .send({
        survey_id: surveyId,
        answers: [
          { question_id: qids[0], answer: '红色' },
          { question_id: qids[1], answer: JSON.stringify(['篮球']) }
        ]
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('已提交');
  });

  it('草稿状态问卷无法提交', async () => {
    const draftRes = await request(app)
      .post('/api/surveys')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '草稿问卷',
        questions: [
          {
            type: 'text',
            title: '问题1',
            required: false,
            sort_order: 0,
            options: []
          }
        ]
      });

    const res = await request(app)
      .post('/api/responses/submit')
      .set('X-Forwarded-For', '5.6.7.80')
      .send({
        survey_id: draftRes.body.survey.id,
        answers: []
      });

    expect(res.statusCode).toBe(403);
  });

  it('不存在的问卷返回404', async () => {
    const res = await request(app)
      .post('/api/responses/submit')
      .send({ survey_id: 99999, answers: [] });

    expect(res.statusCode).toBe(404);
  });
});
