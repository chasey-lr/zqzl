const jwt = require('jsonwebtoken');
const SECRET_KEY = 'shortlink-secret-key-2024';

const users = new Map();
const verificationCodes = new Map();

function generateToken(userId, email) {
  return jwt.sign({ userId, email }, SECRET_KEY, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
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

module.exports = {
  users,
  verificationCodes,
  generateToken,
  verifyToken,
  authMiddleware,
  SECRET_KEY
};
