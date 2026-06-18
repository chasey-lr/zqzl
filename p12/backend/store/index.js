let users = [];
let bookmarks = [];
let userIdCounter = 1;
let bookmarkIdCounter = 1;

/*
 * 数据库接口说明：
 * 以下为内存数组存储。如需替换为MySQL：
 * 1. 安装 mysql2: npm install mysql2
 * 2. 创建数据库连接池，替换下面的 users/bookmarks 数组
 * 3. 将每个 CRUD 函数改为执行 SQL 语句（如 pool.query('INSERT INTO users ...')）
 * 4. 返回 Promise，对应 async/await 调用
 *
 * 示例：
 * const mysql = require('mysql2/promise');
 * const pool = mysql.createPool({ host, user, password, database });
 * 然后将各函数改为使用 pool.execute(...)
 */

const UserStore = {
  async findByEmail(email) {
    return users.find(u => u.email === email);
  },
  async findById(id) {
    return users.find(u => u.id === id);
  },
  async create(userData) {
    const user = {
      id: userIdCounter++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    users.push(user);
    return user;
  }
};

const BookmarkStore = {
  async findByUserId(userId) {
    return bookmarks.filter(b => b.userId === userId);
  },
  async findById(id) {
    return bookmarks.find(b => b.id === id);
  },
  async create(bookmarkData) {
    const bookmark = {
      id: bookmarkIdCounter++,
      ...bookmarkData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    bookmarks.push(bookmark);
    return bookmark;
  },
  async update(id, bookmarkData) {
    const index = bookmarks.findIndex(b => b.id === id);
    if (index === -1) return null;
    bookmarks[index] = {
      ...bookmarks[index],
      ...bookmarkData,
      updatedAt: new Date()
    };
    return bookmarks[index];
  },
  async delete(id) {
    const index = bookmarks.findIndex(b => b.id === id);
    if (index === -1) return false;
    bookmarks.splice(index, 1);
    return true;
  }
};

module.exports = { UserStore, BookmarkStore };
