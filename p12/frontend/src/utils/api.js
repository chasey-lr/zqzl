let failCount = 0;
const MAX_FAIL = 3;
let globalFailHandler = null;
let globalRetryHandler = null;

export function setGlobalFailHandlers(onFail, onRetry) {
  globalFailHandler = onFail;
  globalRetryHandler = onRetry;
}

export function resetFailCount() {
  failCount = 0;
}

export function triggerRetry() {
  failCount = 0;
  if (globalRetryHandler) globalRetryHandler();
}

const BASE_URL = '';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const res = await fetch(BASE_URL + path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      failCount++;
      if (failCount >= MAX_FAIL && globalFailHandler) {
        globalFailHandler(true);
      } else if (globalFailHandler) {
        globalFailHandler(false, data.message || '操作失败，请重试');
      }
      throw new Error(data.message || '请求失败');
    }
    failCount = 0;
    if (globalFailHandler) globalFailHandler(false, null);
    return data;
  } catch (err) {
    failCount++;
    if (failCount >= MAX_FAIL && globalFailHandler) {
      globalFailHandler(true);
    } else if (globalFailHandler) {
      globalFailHandler(false, err.message || '操作失败，请重试');
    }
    throw err;
  }
}

export const api = {
  register: (email, password) => request('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request('/api/auth/me'),
  getBookmarks: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/bookmarks${qs ? '?' + qs : ''}`);
  },
  addBookmark: (data) => request('/api/bookmarks', { method: 'POST', body: JSON.stringify(data) }),
  updateBookmark: (id, data) => request(`/api/bookmarks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBookmark: (id) => request(`/api/bookmarks/${id}`, { method: 'DELETE' })
};
