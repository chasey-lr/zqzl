const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;
let SQL = null;
let dbPath = null;

const init = async () => {
  if (db) return db;

  SQL = await initSqlJs();

  dbPath = process.env.DB_PATH || path.join(dbDir, 'survey.db');

  let dbData = null;
  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      dbData = new Uint8Array(fileBuffer);
    } catch (err) {
      console.warn('Failed to read existing database, starting fresh:', err.message);
    }
  }

  db = new SQL.Database(dbData);

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  return db;
};

const saveDB = () => {
  if (!db || !dbPath) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Failed to save database:', err.message);
  }
};

setInterval(saveDB, 5000);

const runAsync = async (sql, params = []) => {
  if (!db) await init();
  try {
    const stmt = db.prepare(sql);
    stmt.run(params);
    stmt.free();

    const idResult = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0]?.[0];
    const cntResult = db.exec('SELECT changes() as cnt')[0]?.values[0]?.[0];
    const lastID = typeof idResult === 'number' && idResult > 0 ? idResult : (db.exec('SELECT COALESCE(MAX(id), 0) as max FROM (SELECT 1 as id)')[0]?.values[0]?.[0] || 0);

    saveDB();

    const finalID = (() => {
      try {
        const lower = sql.toLowerCase().trim();
        if (lower.startsWith('insert into')) {
          const match = sql.match(/INSERT\s+INTO\s+["'`]?(\w+)["'`]?/i);
          if (match) {
            const table = match[1];
            const maxRow = db.exec(`SELECT COALESCE(MAX(id), 0) as mx FROM "${table}"`);
            const mx = maxRow[0]?.values?.[0]?.[0];
            if (mx && mx > 0) return mx;
          }
        }
      } catch(e) {}
      return idResult || 0;
    })();

    return { lastID: finalID, changes: cntResult || 0 };
  } catch (err) {
    throw err;
  }
};

const getAsync = async (sql, params = []) => {
  if (!db) await init();
  try {
    const stmt = db.prepare(sql);
    const result = stmt.getAsObject(params);
    stmt.free();
    return Object.keys(result).length > 0 ? result : undefined;
  } catch (err) {
    throw err;
  }
};

const allAsync = async (sql, params = []) => {
  if (!db) await init();
  try {
    const stmt = db.prepare(sql);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  } catch (err) {
    throw err;
  }
};

const execAsync = async (sql) => {
  if (!db) await init();
  try {
    db.exec(sql);
    saveDB();
  } catch (err) {
    throw err;
  }
};

const close = () => {
  if (db) {
    saveDB();
    db.close();
    db = null;
  }
};

const getDB = () => db;

module.exports = {
  init,
  runAsync,
  getAsync,
  allAsync,
  execAsync,
  close,
  saveDB,
  get DB() {
    return {
      close,
      run: (sql, params, cb) => {
        (async () => {
          try {
            const r = await runAsync(sql, params);
            if (cb) cb(null, r);
          } catch (err) {
            if (cb) cb(err);
          }
        })();
      }
    };
  },
  getDBInstance: getDB
};
