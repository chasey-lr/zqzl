const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Poll = require('../src/models/Poll');

jest.mock('../src/config/db', () => jest.fn());

process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

let token;
let userId;

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/test_team_voting', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Poll.deleteMany({});

  const userRes = await request(app)
    .post('/api/auth/register')
    .send({
      email: 'test@example.com',
      password: '123456',
      nickname: 'TestUser'
    });

  token = userRes.body.token;
  userId = userRes.body._id;
});

describe('POST /api/polls - 创建投票', () => {
  it('应该成功创建一个公开投票', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '测试投票主题',
        description: '这是一个测试投票',
        options: ['选项A', '选项B', '选项C'],
        type: 'public'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('测试投票主题');
    expect(res.body.description).toBe('这是一个测试投票');
    expect(res.body.options.length).toBe(3);
    expect(res.body.options[0].text).toBe('选项A');
    expect(res.body.options[0].votes).toBe(0);
    expect(res.body.options[0].optionId).toBeDefined();
    expect(res.body.type).toBe('public');
    expect(res.body.creator.toString()).toBe(userId.toString());
    expect(res.body.totalVotes).toBe(0);
  });

  it('应该成功创建一个带截止日期的投票', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '带截止日期的投票',
        options: ['选项1', '选项2'],
        deadline: futureDate.toISOString()
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('带截止日期的投票');
    expect(new Date(res.body.deadline).getTime()).toBeCloseTo(futureDate.getTime(), -2);
  });

  it('应该创建一个私密投票并添加受邀邮箱', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '私密投票',
        options: ['是', '否'],
        type: 'private',
        invitedEmails: ['user1@example.com', 'user2@example.com']
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.type).toBe('private');
    expect(res.body.invitedEmails.length).toBe(2);
    expect(res.body.invitedEmails).toContain('user1@example.com');
  });

  it('未登录用户创建投票应该返回401', async () => {
    const res = await request(app)
      .post('/api/polls')
      .send({
        title: '未授权投票',
        options: ['选项A', '选项B']
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('未授权，请先登录');
  });

  it('主题为空应该返回400', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '',
        options: ['选项A', '选项B']
      });

    expect(res.statusCode).toBe(400);
  });

  it('选项少于2个应该返回400', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '测试投票',
        options: ['只有一个选项']
      });

    expect(res.statusCode).toBe(400);
  });

  it('选项多于8个应该返回400', async () => {
    const options = Array.from({ length: 9 }, (_, i) => `选项${i + 1}`);

    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '测试投票',
        options
      });

    expect(res.statusCode).toBe(400);
  });

  it('每个选项应该有随机颜色和唯一optionId', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '颜色测试',
        options: ['选项A', '选项B', '选项C']
      });

    expect(res.statusCode).toBe(201);
    res.body.options.forEach(option => {
      expect(option.color).toBeDefined();
      expect(option.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(option.optionId).toBeDefined();
      expect(typeof option.optionId).toBe('string');
    });
    const optionIds = res.body.options.map(o => o.optionId);
    const uniqueIds = new Set(optionIds);
    expect(uniqueIds.size).toBe(optionIds.length);
  });
});

describe('POST /api/polls/:id/vote - 投票', () => {
  let pollId;
  let optionIds;

  beforeEach(async () => {
    const pollRes = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '投票测试',
        options: ['选项A', '选项B', '选项C'],
        type: 'public'
      });
    pollId = pollRes.body._id;
    optionIds = pollRes.body.options.map(o => o.optionId);
  });

  it('应该成功投票给一个选项', async () => {
    const res = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .send({ optionId: optionIds[1] });

    expect(res.statusCode).toBe(200);
    expect(res.body.options[1].votes).toBe(1);
    expect(res.body.totalVotes).toBe(1);
    expect(res.body.userVote.optionId).toBe(optionIds[1]);
  });

  it('未登录用户投票应该返回401', async () => {
    const res = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .send({ optionId: optionIds[0] });

    expect(res.statusCode).toBe(401);
  });

  it('对不存在的投票投票应该返回404', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .post(`/api/polls/${fakeId}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .send({ optionId: optionIds[0] });

    expect(res.statusCode).toBe(404);
  });

  it('无效的optionId应该返回400', async () => {
    const res = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .send({ optionId: 'invalid-option-id' });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('无效的选项');
  });

  it('应该允许用户更改投票', async () => {
    await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .send({ optionId: optionIds[0] });

    const res = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .send({ optionId: optionIds[2] });

    expect(res.statusCode).toBe(200);
    expect(res.body.options[0].votes).toBe(0);
    expect(res.body.options[2].votes).toBe(1);
    expect(res.body.totalVotes).toBe(1);
    expect(res.body.userVote.optionId).toBe(optionIds[2]);
  });

  it('同一用户多次投票总票数不增加', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Authorization', `Bearer ${token}`)
        .send({ optionId: optionIds[i % 3] });
    }

    const res = await request(app)
      .get(`/api/polls/${pollId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.totalVotes).toBe(1);
  });

  it('已结束的投票不能投票', async () => {
    const poll = await Poll.findById(pollId);
    poll.isEnded = true;
    await poll.save();

    const res = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .send({ optionId: optionIds[0] });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('投票已结束');
  });

  it('私密投票只有受邀用户可以投票', async () => {
    const privatePollRes = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '私密投票测试',
        options: ['是', '否'],
        type: 'private',
        invitedEmails: ['invited@example.com']
      });

    const anotherUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'another@example.com',
        password: '123456'
      });

    const privateOptionIds = privatePollRes.body.options.map(o => o.optionId);

    const res = await request(app)
      .post(`/api/polls/${privatePollRes.body._id}/vote`)
      .set('Authorization', `Bearer ${anotherUserRes.body.token}`)
      .send({ optionId: privateOptionIds[0] });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe('您没有权限参与此投票');
  });
});

describe('PUT /api/polls/:id - 编辑投票', () => {
  let pollId;
  let optionIds;

  beforeEach(async () => {
    const pollRes = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '编辑测试',
        options: ['选项A', '选项B', '选项C'],
        type: 'public'
      });
    pollId = pollRes.body._id;
    optionIds = pollRes.body.options.map(o => o.optionId);
  });

  it('应该按optionId匹配更新选项文本', async () => {
    await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .send({ optionId: optionIds[0] });

    const res = await request(app)
      .put(`/api/polls/${pollId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: '编辑后的标题',
        options: [
          { optionId: optionIds[0], text: '修改后的选项A' },
          { optionId: optionIds[1], text: '选项B' },
          { optionId: optionIds[2], text: '选项C' }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('编辑后的标题');
    expect(res.body.options[0].text).toBe('修改后的选项A');
    expect(res.body.options[0].votes).toBe(1);
    expect(res.body.options[0].optionId).toBe(optionIds[0]);
  });

  it('删除有票数的选项应该返回400', async () => {
    await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Authorization', `Bearer ${token}`)
      .send({ optionId: optionIds[0] });

    const res = await request(app)
      .put(`/api/polls/${pollId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        options: [
          { optionId: optionIds[1], text: '选项B' },
          { optionId: optionIds[2], text: '选项C' }
        ]
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('已有人投票的选项不可删除');
  });

  it('应该能添加新选项', async () => {
    const res = await request(app)
      .put(`/api/polls/${pollId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        options: [
          { optionId: optionIds[0], text: '选项A' },
          { optionId: optionIds[1], text: '选项B' },
          { optionId: optionIds[2], text: '选项C' },
          { text: '新选项D' }
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.options.length).toBe(4);
    expect(res.body.options[3].text).toBe('新选项D');
    expect(res.body.options[3].optionId).toBeDefined();
    expect(res.body.options[3].votes).toBe(0);
  });
});
