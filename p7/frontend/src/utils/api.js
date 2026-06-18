const API_BASE = '/api';

let consecutiveFailures = 0;
let errorListeners = [];

export const addErrorListener = (fn) => {
  errorListeners.push(fn);
  return () => {
    errorListeners = errorListeners.filter(f => f !== fn);
  };
};

export const notifyError = (message, isPersistent = false) => {
  errorListeners.forEach(fn => fn(message, isPersistent));
};

const resetConsecutiveFailures = () => {
  consecutiveFailures = 0;
};

const handleError = (err, customMessage) => {
  const message = customMessage ||
    (err && err.response && err.response.data && err.response.data.error) ||
    (err && err.message) ||
    '请求失败，请稍后重试';

  consecutiveFailures++;
  const isPersistent = consecutiveFailures >= 2;

  notifyError(message, isPersistent);

  return { message, isPersistent };
};

const getToken = () => localStorage.getItem('token');

const request = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = typeof data === 'object' ? data.error : `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      error.response = { status: response.status, data };
      handleError(error);
      throw error;
    }

    resetConsecutiveFailures();
    return data;
  } catch (err) {
    if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
      handleError(err, '网络连接失败，请检查网络');
    } else if (!err.response) {
      handleError(err);
    }
    throw err;
  }
};

export const api = {
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => request(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (url, body, options = {}) => request(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' })
};

export const resetConsecutiveErrors = resetConsecutiveFailures;
