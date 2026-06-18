require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TODOS_FILE = path.join(DATA_DIR, 'todos.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function loadTodos() {
  if (!fs.existsSync(TODOS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(TODOS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveTodos(todos) {
  fs.writeFileSync(TODOS_FILE, JSON.stringify(todos, null, 2), 'utf8');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'token无效' });
    }
    req.user = user;
    next();
  });
}

app.post('/api/register', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }

    const users = loadUsers();

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    const userIdCounter = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      id: userIdCounter,
      email,
      password: hashedPassword
    };
    users.push(newUser);
    saveUsers(users);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: newUser.id, email: newUser.email }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/todos', authenticateToken, (req, res) => {
  try {
    const todos = loadTodos();
    const userTodos = todos
      .filter(t => t.userId === req.user.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userTodos);
  } catch (error) {
    console.error('获取待办错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/todos', authenticateToken, (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: '标题不能为空' });
    }

    if (title.length > 100) {
      return res.status(400).json({ error: '标题不能超过100字符' });
    }

    const todos = loadTodos();
    const todoIdCounter = todos.length > 0 ? Math.max(...todos.map(t => t.id)) + 1 : 1;

    const newTodo = {
      id: todoIdCounter,
      userId: req.user.userId,
      title: title.trim(),
      description: description || '',
      completed: false,
      createdAt: new Date().toISOString()
    };
    todos.push(newTodo);
    saveTodos(todos);

    res.status(201).json(newTodo);
  } catch (error) {
    console.error('创建待办错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.put('/api/todos/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    const todos = loadTodos();
    const todoIndex = todos.findIndex(t => t.id === parseInt(id) && t.userId === req.user.userId);
    if (todoIndex === -1) {
      return res.status(404).json({ error: '待办事项不存在' });
    }

    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({ error: '标题不能为空' });
      }
      if (title.length > 100) {
        return res.status(400).json({ error: '标题不能超过100字符' });
      }
      todos[todoIndex].title = title.trim();
    }

    if (description !== undefined) {
      todos[todoIndex].description = description;
    }

    if (completed !== undefined) {
      todos[todoIndex].completed = completed;
    }

    saveTodos(todos);
    res.json(todos[todoIndex]);
  } catch (error) {
    console.error('更新待办错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.delete('/api/todos/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const todos = loadTodos();
    const todoIndex = todos.findIndex(t => t.id === parseInt(id) && t.userId === req.user.userId);

    if (todoIndex === -1) {
      return res.status(404).json({ error: '待办事项不存在' });
    }

    todos.splice(todoIndex, 1);
    saveTodos(todos);
    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除待办错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/todos', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`数据目录: ${DATA_DIR}`);
});
