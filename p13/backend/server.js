require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: NODE_ENV,
    time: new Date().toISOString(),
    baseUrl: BASE_URL
  });
});

const authRoutes = require('./routes/auth');
const linkRoutes = require('./routes/links');
const statsRoutes = require('./routes/stats');
const redirectRoutes = require('./routes/redirect');

app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/stats', statsRoutes);
app.use('/s', redirectRoutes);

app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.message);
  if (NODE_ENV === 'development') {
    console.error(err.stack);
  }
  res.status(500).json({
    error: NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log('\n============================================');
  console.log('  短链接管理系统 - 后端服务已启动');
  console.log('============================================');
  console.log(`  运行环境: ${NODE_ENV.toUpperCase()}`);
  console.log(`  监听端口: ${PORT}`);
  console.log(`  服务地址: ${BASE_URL}`);
  console.log(`  健康检查: ${BASE_URL}/api/health`);
  console.log('============================================\n');
});
