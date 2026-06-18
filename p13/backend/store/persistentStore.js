const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`[Storage] 数据目录已创建: ${DATA_DIR}`);
  }
}

function getFilePath(filename) {
  ensureDataDir();
  return path.join(DATA_DIR, filename);
}

function loadFromFile(filename, defaultValue) {
  const filePath = getFilePath(filename);
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`[Storage] 文件不存在，初始化默认值: ${filename}`);
      saveToFile(filename, defaultValue);
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) {
      saveToFile(filename, defaultValue);
      return defaultValue;
    }
    const data = JSON.parse(raw);
    console.log(`[Storage] 已加载数据: ${filename} (${Array.isArray(data) ? data.length : Object.keys(data).length} 条记录)`);
    return data;
  } catch (err) {
    console.error(`[Storage] 加载文件失败 ${filename}:`, err.message);
    saveToFile(filename, defaultValue);
    return defaultValue;
  }
}

function saveToFile(filename, data) {
  const filePath = getFilePath(filename);
  try {
    const tempPath = filePath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`[Storage] 保存文件失败 ${filename}:`, err.message);
    return false;
  }
}

class PersistentMap {
  constructor(filename) {
    this.filename = filename;
    this._map = new Map();
    this._load();
  }

  _load() {
    const obj = loadFromFile(this.filename, {});
    this._map = new Map(Object.entries(obj));
  }

  _save() {
    const obj = Object.fromEntries(this._map);
    saveToFile(this.filename, obj);
  }

  get(key) {
    return this._map.get(key);
  }

  set(key, value) {
    this._map.set(key, value);
    this._save();
    return this;
  }

  has(key) {
    return this._map.has(key);
  }

  delete(key) {
    const result = this._map.delete(key);
    if (result) this._save();
    return result;
  }

  values() {
    return Array.from(this._map.values());
  }

  keys() {
    return Array.from(this._map.keys());
  }

  entries() {
    return Array.from(this._map.entries());
  }

  get size() {
    return this._map.size;
  }

  clear() {
    this._map.clear();
    this._save();
  }
}

class PersistentArray {
  constructor(filename) {
    this.filename = filename;
    this._array = [];
    this._load();
  }

  _load() {
    this._array = loadFromFile(this.filename, []);
  }

  _save() {
    saveToFile(this.filename, this._array);
  }

  push(item) {
    this._array.push(item);
    this._save();
    return this._array.length;
  }

  filter(predicate) {
    return this._array.filter(predicate);
  }

  find(predicate) {
    return this._array.find(predicate);
  }

  slice(...args) {
    return this._array.slice(...args);
  }

  get length() {
    return this._array.length;
  }

  get all() {
    return [...this._array];
  }

  clear() {
    this._array = [];
    this._save();
  }
}

module.exports = {
  PersistentMap,
  PersistentArray,
  ensureDataDir,
  getFilePath,
  DATA_DIR
};
