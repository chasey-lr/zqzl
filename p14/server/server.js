const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');
const groupRoutes = require('./routes/groups');
const csvRoutes = require('./routes/csv');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/csv', csvRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
