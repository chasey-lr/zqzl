const express = require('express');
const router = express.Router();
const { getAllTasks, getTaskById, createTask, updateTask, deleteTask } = require('../db');

const validPriorities = ['high', 'medium', 'low'];
const validStatuses = ['todo', 'in-progress', 'done'];

router.get('/', (req, res) => {
  const tasks = getAllTasks();
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const task = getTaskById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

router.post('/', (req, res) => {
  const { title, description, priority, status, assignee, dueDate } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const taskPriority = validPriorities.includes(priority) ? priority : 'medium';
  const taskStatus = validStatuses.includes(status) ? status : 'todo';

  const newTask = createTask({
    title: title.trim(),
    description: description || '',
    priority: taskPriority,
    status: taskStatus,
    assignee: assignee || '',
    dueDate: dueDate || null
  });

  res.status(201).json(newTask);
});

router.put('/:id', (req, res) => {
  const { title, description, priority, status, assignee, dueDate } = req.body;
  const id = req.params.id;

  const existing = getTaskById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updates = {};

  if (title !== undefined) {
    const trimmed = title.trim();
    if (trimmed === '') {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }
    updates.title = trimmed;
  }

  if (description !== undefined) {
    updates.description = description;
  }

  if (validPriorities.includes(priority)) {
    updates.priority = priority;
  }

  if (validStatuses.includes(status)) {
    updates.status = status;
  }

  if (assignee !== undefined) {
    updates.assignee = assignee;
  }

  if (dueDate !== undefined) {
    updates.dueDate = dueDate || null;
  }

  const updated = updateTask(id, updates);
  res.json(updated);
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const id = req.params.id;

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const existing = getTaskById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updated = updateTask(id, { status });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const id = req.params.id;

  const existing = getTaskById(id);
  if (!existing) {
    return res.status(404).json({ error: 'Task not found' });
  }

  deleteTask(id);
  res.status(204).send();
});

module.exports = router;
