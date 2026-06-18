const request = require('supertest');
const app = require('../src/app');
const { initDB } = require('../src/db');

beforeAll(() => {
  initDB(true);
});

describe('Health Check API', () => {
  test('GET /api/health should return ok status and timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
    expect(!isNaN(new Date(res.body.timestamp).getTime())).toBe(true);
  });
});

describe('Task API - Create Task', () => {
  beforeEach(() => {
    initDB(true);
  });

  test('POST /api/tasks should create a new task with valid data', async () => {
    const taskData = {
      title: '测试任务',
      description: '这是一个测试任务',
      priority: 'high',
      status: 'todo',
      assignee: '测试员',
      dueDate: '2024-12-31'
    };

    const res = await request(app)
      .post('/api/tasks')
      .send(taskData);

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe(taskData.title);
    expect(res.body.description).toBe(taskData.description);
    expect(res.body.priority).toBe(taskData.priority);
    expect(res.body.status).toBe(taskData.status);
    expect(res.body.assignee).toBe(taskData.assignee);
    expect(res.body.dueDate).toBe(taskData.dueDate);
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  test('POST /api/tasks should return 400 when title is empty', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('POST /api/tasks should return 400 when title is missing', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ description: 'no title' });

    expect(res.statusCode).toBe(400);
  });

  test('POST /api/tasks should use default values for optional fields', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '默认值测试' });

    expect(res.statusCode).toBe(201);
    expect(res.body.priority).toBe('medium');
    expect(res.body.status).toBe('todo');
    expect(res.body.description).toBe('');
    expect(res.body.assignee).toBe('');
    expect(res.body.dueDate).toBeNull();
  });
});

describe('Task API - Update Task Status', () => {
  let taskId;

  beforeEach(async () => {
    initDB(true);
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: '状态更新测试' });
    taskId = res.body.id;
  });

  test('PATCH /api/tasks/:id/status should update task status to in-progress', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .send({ status: 'in-progress' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('in-progress');
    expect(res.body.id).toBe(taskId);
  });

  test('PATCH /api/tasks/:id/status should update task status to done', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .send({ status: 'done' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('done');
  });

  test('PATCH /api/tasks/:id/status should return 400 for invalid status', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .send({ status: 'invalid-status' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('PATCH /api/tasks/:id/status should return 404 for non-existent task', async () => {
    const res = await request(app)
      .patch('/api/tasks/nonexistent-id/status')
      .send({ status: 'done' });

    expect(res.statusCode).toBe(404);
  });
});

describe('Task API - Full CRUD', () => {
  beforeEach(() => {
    initDB(true);
  });

  test('GET /api/tasks should return list of tasks', async () => {
    await request(app).post('/api/tasks').send({ title: '任务1' });
    await request(app).post('/api/tasks').send({ title: '任务2' });

    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test('GET /api/tasks/:id should return single task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ title: '获取测试' });

    const res = await request(app).get(`/api/tasks/${createRes.body.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('获取测试');
  });

  test('PUT /api/tasks/:id should update entire task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ title: '更新前' });

    const res = await request(app)
      .put(`/api/tasks/${createRes.body.id}`)
      .send({
        title: '更新后',
        description: '新描述',
        priority: 'low',
        assignee: '新人'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('更新后');
    expect(res.body.description).toBe('新描述');
    expect(res.body.priority).toBe('low');
    expect(res.body.assignee).toBe('新人');
  });

  test('DELETE /api/tasks/:id should delete task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ title: '待删除' });

    const delRes = await request(app).delete(`/api/tasks/${createRes.body.id}`);
    expect(delRes.statusCode).toBe(204);

    const getRes = await request(app).get(`/api/tasks/${createRes.body.id}`);
    expect(getRes.statusCode).toBe(404);
  });
});
