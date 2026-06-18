const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
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
  console.error('Error:', err.message);
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`短链接后端服务运行在 http://localhost:${PORT}`);
});
