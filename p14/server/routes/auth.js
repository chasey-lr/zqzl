const express = require('express');
const bcrypt = require('bcryptjs');
const { findUserByEmail, createUser } = require('../data/store');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }

    if (findUserByEmail(email)) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const user = createUser(email, passwordHash);
    const token = generateToken(user.id);

    res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码不能为空' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }

    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: '服务器错误' });
  }
});

module.exports = router;
