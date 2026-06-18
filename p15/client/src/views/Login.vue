<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>运动打卡记录</h1>
      <h2>登录</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label">用户名</label>
          <input v-model="username" type="text" class="input" placeholder="请输入用户名" />
        </div>
        <div class="form-group">
          <label class="form-label">密码</label>
          <input v-model="password" type="password" class="input" placeholder="请输入密码" />
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
      <p class="auth-link">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { api, resetFailCount, incrementFailCount, getFailCount } from '../utils/api'
import { setToken, setUser } from '../utils/helpers'

const router = useRouter()
const notify = inject('notify')
const username = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    notify?.error('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const res = await api.login(username.value, password.value)
    setToken(res.token)
    setUser(res.user)
    resetFailCount()
    router.push('/')
  } catch (e) {
    const count = incrementFailCount()
    const persistent = count >= 3
    notify?.error(e.message, {
      persistent,
      retry: persistent ? handleLogin : null
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}
.auth-card {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  width: 100%;
  max-width: 400px;
}
.auth-card h1 {
  text-align: center;
  color: #4f46e5;
  margin-bottom: 8px;
  font-size: 24px;
}
.auth-card h2 {
  text-align: center;
  color: #374151;
  margin-bottom: 24px;
  font-size: 20px;
}
.auth-link {
  text-align: center;
  margin-top: 20px;
  color: #6b7280;
  font-size: 14px;
}
.auth-link a {
  color: #4f46e5;
  text-decoration: none;
  font-weight: 500;
}
.auth-link a:hover {
  text-decoration: underline;
}
</style>
