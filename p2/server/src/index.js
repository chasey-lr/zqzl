const app = require('./app');
const { initDB } = require('./db');

const PORT = process.env.PORT || 3001;

initDB();

app.listen(PORT, () => {
  const now = new Date().toISOString();
  console.log(`[${now}] [INFO] Server running on port ${PORT}`);
});
