const jwt = require('jsonwebtoken');
const { getUserById } = require('../data/store');

const JWT_SECRET = 'contact-book-secret-key-2024';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authMiddleware, generateToken };
