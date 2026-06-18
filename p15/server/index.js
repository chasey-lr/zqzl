const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'exercise-tracker-secret-key-2024';

app.use(cors());
app.use(express.json());

const CALORIE_RATES = {
  '跑步': 10,
  '骑行': 8,
  '游泳': 12,
  '健身': 7,
  '瑜伽': 4,
  '其他': 5
};

const DEFAULT_TYPES = ['跑步', '骑行', '游泳', '健身', '瑜伽', '其他'];

const users = new Map();
const records = new Map();
const userCustomTypes = new Map();
const userStreakInfo = new Map();

let recordIdCounter = 1;

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: '未授权访问' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: '无效的令牌' });
    req.user = user;
    next();
  });
}

function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '7d' });
}

function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function calculateStreak(userId) {
  const userRecords = Array.from(records.values()).filter(r => r.userId === userId);
  if (userRecords.length === 0) return 0;

  const dates = new Set(userRecords.map(r => formatDate(r.date)));
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  while (true) {
    const dateStr = formatDate(current);
    if (dates.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function estimateCalories(type, duration) {
  const rate = CALORIE_RATES[type] || CALORIE_RATES['其他'];
  return Math.round(rate * duration);
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }

    for (const u of users.values()) {
      if (u.username === username) {
        return res.status(400).json({ error: '用户名已存在' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();
    const user = { id: userId, username, password: hashedPassword };
    users.set(userId, user);
    userCustomTypes.set(userId, [...DEFAULT_TYPES]);
    userStreakInfo.set(userId, { lastStreak: 0, lastDate: null });

    const token = generateToken(user);
    res.json({ token, user: { id: userId, username } });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    let foundUser = null;
    for (const u of users.values()) {
      if (u.username === username) {
        foundUser = u;
        break;
      }
    }
    if (!foundUser) return res.status(400).json({ error: '用户不存在' });

    const valid = await bcrypt.compare(password, foundUser.password);
    if (!valid) return res.status(400).json({ error: '密码错误' });

    const token = generateToken(foundUser);
    res.json({ token, user: { id: foundUser.id, username: foundUser.username } });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

app.get('/api/types', authenticateToken, (req, res) => {
  const types = userCustomTypes.get(req.user.id) || [...DEFAULT_TYPES];
  res.json({ types });
});

app.post('/api/types', authenticateToken, (req, res) => {
  const { type } = req.body;
  if (!type || !type.trim()) {
    return res.status(400).json({ error: '运动类型不能为空' });
  }
  let types = userCustomTypes.get(req.user.id) || [...DEFAULT_TYPES];
  if (!types.includes(type.trim())) {
    types.push(type.trim());
    userCustomTypes.set(req.user.id, types);
  }
  res.json({ types });
});

app.post('/api/records', authenticateToken, (req, res) => {
  try {
    const { type, duration, calories, date, remark } = req.body;

    if (!type) return res.status(400).json({ error: '请选择运动类型' });
    if (!duration || duration <= 0 || !Number.isInteger(Number(duration))) {
      return res.status(400).json({ error: '运动时长必须为正整数' });
    }

    const record = {
      id: recordIdCounter++,
      userId: req.user.id,
      type: type.trim(),
      duration: parseInt(duration),
      calories: calories ? parseInt(calories) : estimateCalories(type.trim(), parseInt(duration)),
      date: date ? new Date(date) : new Date(),
      remark: remark || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    records.set(record.id, record);

    const types = userCustomTypes.get(req.user.id) || [...DEFAULT_TYPES];
    if (!types.includes(record.type)) {
      types.push(record.type);
      userCustomTypes.set(req.user.id, types);
    }

    const streak = calculateStreak(req.user.id);
    const streakInfo = userStreakInfo.get(req.user.id) || { lastStreak: 0, lastDate: null };
    const todayStr = formatDate(new Date());
    let streakReset = false;
    if (streakInfo.lastStreak > 0 && streak === 1 && streakInfo.lastDate !== todayStr) {
      streakReset = true;
    }
    userStreakInfo.set(req.user.id, { lastStreak: streak, lastDate: todayStr });

    res.json({ record, streak, streakReset });
  } catch (e) {
    res.status(500).json({ error: '创建记录失败' });
  }
});

app.put('/api/records/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const record = records.get(id);
    if (!record || record.userId !== req.user.id) {
      return res.status(404).json({ error: '记录不存在' });
    }

    const { type, duration, calories, date, remark } = req.body;
    if (!type) return res.status(400).json({ error: '请选择运动类型' });
    if (!duration || duration <= 0 || !Number.isInteger(Number(duration))) {
      return res.status(400).json({ error: '运动时长必须为正整数' });
    }

    record.type = type.trim();
    record.duration = parseInt(duration);
    record.calories = calories ? parseInt(calories) : estimateCalories(type.trim(), parseInt(duration));
    record.date = date ? new Date(date) : record.date;
    record.remark = remark || '';
    record.updatedAt = new Date();

    records.set(id, record);

    const types = userCustomTypes.get(req.user.id) || [...DEFAULT_TYPES];
    if (!types.includes(record.type)) {
      types.push(record.type);
      userCustomTypes.set(req.user.id, types);
    }

    const streak = calculateStreak(req.user.id);
    res.json({ record, streak });
  } catch (e) {
    res.status(500).json({ error: '更新记录失败' });
  }
});

app.delete('/api/records/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const record = records.get(id);
    if (!record || record.userId !== req.user.id) {
      return res.status(404).json({ error: '记录不存在' });
    }
    records.delete(id);
    const streak = calculateStreak(req.user.id);
    res.json({ success: true, streak });
  } catch (e) {
    res.status(500).json({ error: '删除记录失败' });
  }
});

app.get('/api/records', authenticateToken, (req, res) => {
  try {
    const { date, type, startDate, endDate, page = 1, pageSize = 10 } = req.query;
    let userRecords = Array.from(records.values()).filter(r => r.userId === req.user.id);

    if (date) {
      const targetDate = formatDate(date);
      userRecords = userRecords.filter(r => formatDate(r.date) === targetDate);
    }
    if (type && type !== 'all') {
      userRecords = userRecords.filter(r => r.type === type);
    }
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      userRecords = userRecords.filter(r => new Date(r.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      userRecords = userRecords.filter(r => new Date(r.date) <= end);
    }

    userRecords.sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);

    const total = userRecords.length;
    const p = parseInt(page);
    const ps = parseInt(pageSize);
    const start = (p - 1) * ps;
    const paginatedRecords = userRecords.slice(start, start + ps);

    let totalDuration = 0;
    let totalCalories = 0;
    userRecords.forEach(r => {
      totalDuration += r.duration;
      totalCalories += r.calories;
    });

    const streak = calculateStreak(req.user.id);

    res.json({
      records: paginatedRecords,
      total,
      page: p,
      pageSize: ps,
      hasMore: start + ps < total,
      totalDuration,
      totalCalories,
      streak
    });
  } catch (e) {
    res.status(500).json({ error: '获取记录失败' });
  }
});

app.get('/api/records/calendar', authenticateToken, (req, res) => {
  try {
    const { month, year } = req.query;
    const userRecords = Array.from(records.values()).filter(r => r.userId === req.user.id);
    const calendarData = {};

    userRecords.forEach(r => {
      const d = new Date(r.date);
      if (month && year) {
        if (d.getFullYear() !== parseInt(year) || d.getMonth() !== parseInt(month) - 1) {
          return;
        }
      }
      const dateKey = formatDate(d);
      if (!calendarData[dateKey]) {
        calendarData[dateKey] = [];
      }
      calendarData[dateKey].push(r.type);
    });

    res.json({ calendar: calendarData });
  } catch (e) {
    res.status(500).json({ error: '获取日历数据失败' });
  }
});

app.get('/api/stats', authenticateToken, (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    let userRecords = Array.from(records.values()).filter(r => r.userId === req.user.id);

    if (type && type !== 'all') {
      userRecords = userRecords.filter(r => r.type === type);
    }
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      userRecords = userRecords.filter(r => new Date(r.date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      userRecords = userRecords.filter(r => new Date(r.date) <= end);
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const weekRecords = userRecords.filter(r => {
      const d = new Date(r.date);
      return d >= weekStart && d <= weekEnd;
    });
    const monthRecords = userRecords.filter(r => {
      const d = new Date(r.date);
      return d >= monthStart && d <= monthEnd;
    });

    const weekDaily = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      weekDaily[formatDate(d)] = { duration: 0, calories: 0 };
    }
    weekRecords.forEach(r => {
      const key = formatDate(r.date);
      if (weekDaily[key]) {
        weekDaily[key].duration += r.duration;
        weekDaily[key].calories += r.calories;
      }
    });

    const monthDaily = {};
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      monthDaily[formatDate(d)] = { duration: 0, calories: 0 };
    }
    monthRecords.forEach(r => {
      const key = formatDate(r.date);
      if (monthDaily[key]) {
        monthDaily[key].duration += r.duration;
        monthDaily[key].calories += r.calories;
      }
    });

    const typeStats = {};
    userRecords.forEach(r => {
      if (!typeStats[r.type]) {
        typeStats[r.type] = { duration: 0, calories: 0, count: 0 };
      }
      typeStats[r.type].duration += r.duration;
      typeStats[r.type].calories += r.calories;
      typeStats[r.type].count += 1;
    });

    const streak = calculateStreak(req.user.id);

    res.json({
      weekDaily,
      monthDaily,
      typeStats,
      weekTotal: weekRecords.reduce((s, r) => s + r.duration, 0),
      weekCalories: weekRecords.reduce((s, r) => s + r.calories, 0),
      monthTotal: monthRecords.reduce((s, r) => s + r.duration, 0),
      monthCalories: monthRecords.reduce((s, r) => s + r.calories, 0),
      streak
    });
  } catch (e) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

app.get('/api/estimate', authenticateToken, (req, res) => {
  const { type, duration } = req.query;
  if (!type || !duration) {
    return res.status(400).json({ error: '参数不完整' });
  }
  const calories = estimateCalories(type, parseInt(duration));
  res.json({ calories });
});

app.listen(PORT, () => {
  console.log(`运动打卡后端服务运行在 http://localhost:${PORT}`);
});
