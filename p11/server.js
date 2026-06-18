const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const users = [];
const todos = [];

let todoIdCounter = 1;
let userIdCounter = 1;

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

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      id: userIdCounter++,
      email,
      password: hashedPassword
    };
    users.push(newUser);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: newUser.id, email: newUser.email }
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

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
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/todos', authenticateToken, (req, res) => {
  try {
    const userTodos = todos
      .filter(t => t.userId === req.user.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(userTodos);
  } catch (error) {
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

    const newTodo = {
      id: todoIdCounter++,
      userId: req.user.userId,
      title: title.trim(),
      description: description || '',
      completed: false,
      createdAt: new Date().toISOString()
    };
    todos.push(newTodo);

    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.put('/api/todos/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

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

    res.json(todos[todoIndex]);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.delete('/api/todos/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const todoIndex = todos.findIndex(t => t.id === parseInt(id) && t.userId === req.user.userId);

    if (todoIndex === -1) {
      return res.status(404).json({ error: '待办事项不存在' });
    }

    todos.splice(todoIndex, 1);
    res.json({ message: '删除成功' });
  } catch (error) {
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
});
