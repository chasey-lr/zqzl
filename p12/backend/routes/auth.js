const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { UserStore } = require('../store');

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '邮箱和密码不能为空' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '邮箱格式不正确' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: '密码至少6位' });
    }
    const existingUser = await UserStore.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserStore.create({ email, password: hashedPassword });
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: '邮箱和密码不能为空' });
    }
    const user = await UserStore.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: '登录成功',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: '登录失败' });
  }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await UserStore.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ user: { id: user.id, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: '获取用户信息失败' });
  }
});

module.exports = router;
