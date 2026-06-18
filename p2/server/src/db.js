const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'tasks.json');

let tasksStore = [];
let isMemoryMode = false;

function initDB(memoryMode = false) {
  isMemoryMode = memoryMode;

  if (memoryMode) {
    tasksStore = [];
    return;
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(dataFile)) {
    try {
      const data = fs.readFileSync(dataFile, 'utf-8');
      tasksStore = JSON.parse(data);
    } catch (e) {
      tasksStore = [];
    }
  } else {
    tasksStore = [];
    saveToFile();
  }
}

function saveToFile() {
  if (isMemoryMode) return;
  try {
    fs.writeFileSync(dataFile, JSON.stringify(tasksStore, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save tasks to file:', e.message);
  }
}

function getAllTasks() {
  return [...tasksStore].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getTaskById(id) {
  return tasksStore.find(t => t.id === id) || null;
}

function createTask(taskData) {
  const now = new Date().toISOString();
  const task = {
    id: uuidv4(),
    title: taskData.title,
    description: taskData.description || '',
    priority: taskData.priority || 'medium',
    status: taskData.status || 'todo',
    assignee: taskData.assignee || '',
    dueDate: taskData.dueDate || null,
    createdAt: now,
    updatedAt: now
  };
  tasksStore.push(task);
  saveToFile();
  return task;
}

function updateTask(id, updates) {
  const index = tasksStore.findIndex(t => t.id === id);
  if (index === -1) return null;

  const existing = tasksStore[index];
  const updated = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  tasksStore[index] = updated;
  saveToFile();
  return updated;
}

function deleteTask(id) {
  const index = tasksStore.findIndex(t => t.id === id);
  if (index === -1) return false;
  tasksStore.splice(index, 1);
  saveToFile();
  return true;
}

module.exports = {
  initDB,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask
};
