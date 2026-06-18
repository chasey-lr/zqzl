import { getToken, removeToken } from './helpers'

const BASE_URL = '/api'

async function request(url, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers
  })

  const data = await response.json()
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      removeToken()
      window.location.href = '/login'
    }
    throw new Error(data.error || '请求失败')
  }
  return data
}

export const api = {
  register(username, password) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  },
  login(username, password) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  },
  getTypes() {
    return request('/types')
  },
  addType(type) {
    return request('/types', {
      method: 'POST',
      body: JSON.stringify({ type })
    })
  },
  createRecord(record) {
    return request('/records', {
      method: 'POST',
      body: JSON.stringify(record)
    })
  },
  updateRecord(id, record) {
    return request(`/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record)
    })
  },
  deleteRecord(id) {
    return request(`/records/${id}`, {
      method: 'DELETE'
    })
  },
  getRecords(params = {}) {
    const query = new URLSearchParams()
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== '' && params[key] !== null) {
        query.append(key, params[key])
      }
    })
    const qs = query.toString()
    return request(`/records${qs ? '?' + qs : ''}`)
  },
  getCalendar(params = {}) {
    const query = new URLSearchParams()
    Object.keys(params).forEach(key => {
      if (params[key]) query.append(key, params[key])
    })
    const qs = query.toString()
    return request(`/records/calendar${qs ? '?' + qs : ''}`)
  },
  getStats(params = {}) {
    const query = new URLSearchParams()
    Object.keys(params).forEach(key => {
      if (params[key]) query.append(key, params[key])
    })
    const qs = query.toString()
    return request(`/stats${qs ? '?' + qs : ''}`)
  },
  estimate(type, duration) {
    return request(`/estimate?type=${encodeURIComponent(type)}&duration=${duration}`)
  }
}

let failCount = 0

export function resetFailCount() {
  failCount = 0
}

export function incrementFailCount() {
  failCount++
  return failCount
}

export function getFailCount() {
  return failCount
}
