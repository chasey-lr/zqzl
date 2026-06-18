const API_BASE = '/api';

function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  if (data !== null) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

export const logger = {
  info: (msg, data) => log('INFO', msg, data),
  warn: (msg, data) => log('WARN', msg, data),
  error: (msg, data) => log('ERROR', msg, data),
  debug: (msg, data) => log('DEBUG', msg, data)
};

async function request(url, options = {}) {
  const fullUrl = `${API_BASE}${url}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  logger.info(`Request: ${options.method || 'GET'} ${fullUrl}`);

  try {
    const response = await fetch(fullUrl, config);
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));

    if (!response.ok) {
      logger.warn(`Response: ${response.status} ${fullUrl}`, data);
      throw new Error(data?.error || `HTTP ${response.status}`);
    }

    logger.info(`Response: ${response.status} ${fullUrl}`);
    return data;
  } catch (err) {
    logger.error(`Request failed: ${fullUrl}`, err.message);
    throw err;
  }
}

export const api = {
  getHealth: () => request('/health'),

  getTasks: () => request('/tasks'),

  getTask: (id) => request(`/tasks/${id}`),

  createTask: (task) => request('/tasks', {
    method: 'POST',
    body: JSON.stringify(task)
  }),

  updateTask: (id, task) => request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(task)
  }),

  updateTaskStatus: (id, status) => request(`/tasks/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  deleteTask: (id) => request(`/tasks/${id}`, {
    method: 'DELETE'
  })
};
