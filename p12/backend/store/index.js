const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOKMARKS_FILE = path.join(DATA_DIR, 'bookmarks.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const content = fs.readFileSync(filePath, 'utf8');
    return content.trim() ? JSON.parse(content) : defaultValue;
  } catch (err) {
    console.error(`读取 ${filePath} 失败:`, err);
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`写入 ${filePath} 失败:`, err);
    return false;
  }
}

let users = readJson(USERS_FILE, []);
let bookmarks = readJson(BOOKMARKS_FILE, []);
let userIdCounter = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
let bookmarkIdCounter = bookmarks.length > 0 ? Math.max(...bookmarks.map(b => b.id)) + 1 : 1;

function saveUsers() {
  writeJson(USERS_FILE, users);
}

function saveBookmarks() {
  writeJson(BOOKMARKS_FILE, bookmarks);
}

/*
 * 数据库接口说明：
 * 当前为 JSON 文件持久化存储。如需替换为 MySQL：
 * 1. 安装 mysql2: npm install mysql2
 * 2. 创建数据库连接池，替换下面的 users/bookmarks 数组和读写函数
 * 3. 将每个 CRUD 函数改为执行 SQL 语句（如 pool.query('INSERT INTO users ...')）
 *
 * 示例：
 * const mysql = require('mysql2/promise');
 * const pool = mysql.createPool({ host, user, password, database });
 * 然后将各函数改为使用 pool.execute(...)
 */

const UserStore = {
  async findByEmail(email) {
    return users.find(u => u.email === email) || null;
  },
  async findById(id) {
    return users.find(u => u.id === id) || null;
  },
  async create(userData) {
    const user = {
      id: userIdCounter++,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(user);
    saveUsers();
    return user;
  }
};

const BookmarkStore = {
  async findByUserId(userId) {
    return bookmarks
      .filter(b => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async findById(id) {
    return bookmarks.find(b => b.id === id) || null;
  },
  async create(bookmarkData) {
    const bookmark = {
      id: bookmarkIdCounter++,
      ...bookmarkData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    bookmarks.push(bookmark);
    saveBookmarks();
    return bookmark;
  },
  async update(id, bookmarkData) {
    const index = bookmarks.findIndex(b => b.id === id);
    if (index === -1) return null;
    bookmarks[index] = {
      ...bookmarks[index],
      ...bookmarkData,
      updatedAt: new Date().toISOString()
    };
    saveBookmarks();
    return bookmarks[index];
  },
  async delete(id) {
    const index = bookmarks.findIndex(b => b.id === id);
    if (index === -1) return false;
    bookmarks.splice(index, 1);
    saveBookmarks();
    return true;
  }
};

module.exports = { UserStore, BookmarkStore };
