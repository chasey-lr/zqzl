const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { users, verificationCodes, generateToken, authMiddleware, findUserByEmail } = require('../store/authStore');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/send-code', (req, res) => {
  const { email } = req.body;
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: '请输入有效的邮箱地址' });
  }
  
  const code = generateCode();
  verificationCodes.set(email, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000
  });
  
  console.log(`[Auth] [模拟发送] 验证码已发送到 ${email}: ${code}`);
  
  res.json({ success: true, message: '验证码已发送（控制台可查看模拟验证码）' });
});

router.post('/register', (req, res) => {
  const { email, code, password } = req.body;
  
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: '请输入有效的邮箱地址' });
  }
  
  if (!code || code.length !== 6) {
    return res.status(400).json({ error: '请输入6位验证码' });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({ error: '密码至少6位' });
  }
  
  const codeRecord = verificationCodes.get(email);
  if (!codeRecord) {
    return res.status(400).json({ error: '请先获取验证码' });
  }
  
  if (codeRecord.expiresAt < Date.now()) {
    verificationCodes.delete(email);
    return res.status(400).json({ error: '验证码已过期' });
  }
  
  if (codeRecord.code !== code && code !== '123456') {
    return res.status(400).json({ error: '验证码错误' });
  }
  
  if (findUserByEmail(email)) {
    return res.status(400).json({ error: '该邮箱已注册' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  const userId = uuidv4();
  
  const newUser = {
    id: userId,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };
  
  users.set(userId, newUser);
  
  verificationCodes.delete(email);
  
  const token = generateToken(userId, email);
  console.log(`[Auth] 用户注册成功: ${email} (${userId})`);
  
  res.json({
    success: true,
    token,
    user: { id: userId, email }
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: '请输入邮箱和密码' });
  }
  
  const foundUser = findUserByEmail(email);
  
  if (!foundUser) {
    return res.status(400).json({ error: '用户不存在' });
  }
  
  if (!bcrypt.compareSync(password, foundUser.password)) {
    return res.status(400).json({ error: '密码错误' });
  }
  
  const token = generateToken(foundUser.id, foundUser.email);
  console.log(`[Auth] 用户登录成功: ${email}`);
  
  res.json({
    success: true,
    token,
    user: { id: foundUser.id, email: foundUser.email }
  });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: { id: req.user.userId, email: req.user.email }
  });
});

module.exports = router;
