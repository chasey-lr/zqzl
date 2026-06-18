import { ref } from 'vue'

export const TYPE_COLORS = {
  '跑步': '#ef4444',
  '骑行': '#3b82f6',
  '游泳': '#06b6d4',
  '健身': '#8b5cf6',
  '瑜伽': '#ec4899',
  '其他': '#6b7280'
}

let colorCounter = 0
const extraColors = ['#f97316', '#84cc16', '#14b8a6', '#6366f1', '#a855f7', '#f43f5e']

export function getTypeColor(type) {
  if (TYPE_COLORS[type]) return TYPE_COLORS[type]
  const idx = colorCounter % extraColors.length
  const color = extraColors[idx]
  TYPE_COLORS[type] = color
  colorCounter++
  return color
}

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  localStorage.setItem('token', token)
}

export function removeToken() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function getUser() {
  const u = localStorage.getItem('user')
  return u ? JSON.parse(u) : null
}

export function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user))
}

export function formatDateTime(date) {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDate(date) {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function relativeTime(date) {
  const now = new Date()
  const target = new Date(date)
  const diff = now - target
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return formatDate(date)
}
