const express = require('express');
const cors = require('cors');
const loggerMiddleware = require('./middleware/logger');

const tasksRouter = require('./routes/tasks');
const healthRouter = require('./routes/health');

const app = express();

app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

app.use('/api/health', healthRouter);
app.use('/api/tasks', tasksRouter);

app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR] ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
