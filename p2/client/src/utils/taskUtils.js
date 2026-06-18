export const STATUS_LABELS = {
  'todo': '待办',
  'in-progress': '进行中',
  'done': '已完成'
};

export const STATUS_ORDER = ['todo', 'in-progress', 'done'];

export const PRIORITY_LABELS = {
  'high': '高',
  'medium': '中',
  'low': '低'
};

export const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function isDueToday(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due.getTime() === today.getTime();
}

export function isOverdueOrToday(dueDate) {
  return isOverdue(dueDate) || isDueToday(dueDate);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTasksByStatus(tasks) {
  const groups = {
    'todo': [],
    'in-progress': [],
    'done': []
  };
  tasks.forEach(task => {
    if (groups[task.status]) {
      groups[task.status].push(task);
    }
  });
  return groups;
}

export function hasAssigneeAnyTasks(tasks, assignee) {
  if (!assignee) return false;
  return tasks.some(t => t.assignee && t.assignee.trim() === assignee.trim());
}
