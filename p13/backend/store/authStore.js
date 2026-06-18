require('dotenv').config();
const jwt = require('jsonwebtoken');
const { PersistentMap, PersistentArray } = require('./persistentStore');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET || JWT_SECRET.includes('please_change') || JWT_SECRET.includes('change_me')) {
  console.warn('\n============================================');
  console.warn('⚠️  警告：JWT_SECRET 使用了默认或不安全的值！');
  console.warn('   请在 .env 文件中设置强随机密钥。');
  console.warn('   生产环境必须修改此配置！');
  console.warn('============================================\n');
}

const users = new PersistentMap('users.json');
const verificationCodes = new Map();

function generateToken(userId, email) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
  req.user = decoded;
  next();
}

function findUserByEmail(email) {
  for (const user of users.values()) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

module.exports = {
  users,
  verificationCodes,
  generateToken,
  verifyToken,
  authMiddleware,
  findUserByEmail,
  JWT_SECRET
};
