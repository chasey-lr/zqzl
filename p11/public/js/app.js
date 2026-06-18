let todos = [];
let currentFilter = 'all';
let editingTodoId = null;

const todoList = document.getElementById('todoList');
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const filterSelect = document.getElementById('filterSelect');
const emptyState = document.getElementById('emptyState');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function fetchTodos() {
  try {
    const response = await fetch('/api/todos', {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error('获取待办失败');
    }

    todos = await response.json();
    renderTodos();
  } catch (error) {
    showError('操作失败，请重试');
  }
}

async function addTodo() {
  const title = todoInput.value.trim();

  if (!title) {
    alert('标题不能为空');
    return;
  }

  if (title.length > 100) {
    alert('标题不能超过100字符');
    return;
  }

  try {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error('添加失败');
    }

    todoInput.value = '';
    fetchTodos();
  } catch (error) {
    showError('操作失败，请重试');
  }
}

async function toggleTodo(id) {
  if (editingTodoId !== null) return;

  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ completed: !todo.completed })
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error('更新失败');
    }

    fetchTodos();
  } catch (error) {
    showError('操作失败，请重试');
  }
}

async function deleteTodo(id) {
  if (editingTodoId !== null) return;

  if (!confirm('确定删除此事项吗？')) {
    return;
  }

  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error('删除失败');
    }

    fetchTodos();
  } catch (error) {
    showError('操作失败，请重试');
  }
}

function startEdit(id) {
  if (editingTodoId !== null) return;

  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  editingTodoId = id;
  renderTodos();
}

function cancelEdit() {
  editingTodoId = null;
  renderTodos();
}

async function saveEdit(id) {
  const input = document.getElementById(`edit-input-${id}`);
  const title = input.value.trim();

  if (!title) {
    alert('标题不能为空');
    return;
  }

  if (title.length > 100) {
    alert('标题不能超过100字符');
    return;
  }

  const todo = todos.find(t => t.id === id);
  if (todo && todo.title === title) {
    cancelEdit();
    return;
  }

  try {
    const response = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ title })
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error('保存失败');
    }

    editingTodoId = null;
    fetchTodos();
  } catch (error) {
    showError('操作失败，请重试');
  }
}

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  }
}

function formatAbsoluteTime(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function getFilteredTodos() {
  switch (currentFilter) {
    case 'pending':
      return todos.filter(t => !t.completed);
    case 'completed':
      return todos.filter(t => t.completed);
    default:
      return todos;
  }
}

function updateStats() {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const pending = total - completed;

  document.getElementById('totalCount').textContent = total;
  document.getElementById('pendingCount').textContent = pending;
  document.getElementById('completedCount').textContent = completed;
}

function renderTodos() {
  const filteredTodos = getFilteredTodos();
  updateStats();

  if (filteredTodos.length === 0) {
    todoList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  todoList.innerHTML = filteredTodos.map(todo => {
    if (editingTodoId === todo.id) {
      return `
        <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
          <input type="checkbox" class="todo-checkbox" disabled ${todo.completed ? 'checked' : ''}>
          <div class="edit-form">
            <input type="text" class="edit-input" id="edit-input-${todo.id}" value="${escapeHtml(todo.title)}" maxlength="100">
            <div class="edit-actions">
              <button class="save-btn" onclick="saveEdit(${todo.id})">保存</button>
              <button class="cancel-btn" onclick="cancelEdit()">取消</button>
            </div>
          </div>
        </li>
      `;
    }

    return `
      <li class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
        <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodo(${todo.id})">
        <div class="todo-content">
          <div class="todo-title">${escapeHtml(todo.title)}</div>
          ${todo.description ? `<div class="todo-description">${escapeHtml(todo.description)}</div>` : ''}
          <span class="todo-time" title="${formatAbsoluteTime(todo.createdAt)}">${formatRelativeTime(todo.createdAt)}</span>
        </div>
        <div class="todo-actions">
          <button class="edit-btn" onclick="startEdit(${todo.id})">编辑</button>
          <button class="delete-btn" onclick="deleteTodo(${todo.id})">删除</button>
        </div>
      </li>
    `;
  }).join('');

  if (editingTodoId !== null) {
    const input = document.getElementById(`edit-input-${editingTodoId}`);
    if (input) {
      input.focus();
      input.select();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveEdit(editingTodoId);
        } else if (e.key === 'Escape') {
          cancelEdit();
        }
      });
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function initUserInfo() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    userEmail.textContent = user.email;
  }
}

addBtn.addEventListener('click', addTodo);

todoInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addTodo();
  }
});

filterSelect.addEventListener('change', (e) => {
  currentFilter = e.target.value;
  renderTodos();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
});

function init() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  initUserInfo();
  fetchTodos();
}

init();
