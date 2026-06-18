<template>
  <nav class="navbar">
    <div class="nav-container">
      <div class="nav-brand">🏃 运动打卡</div>
      <div class="nav-links">
        <router-link to="/" class="nav-link" :class="{ active: $route.path === '/' }">今日打卡</router-link>
        <router-link to="/stats" class="nav-link" :class="{ active: $route.path === '/stats' }">统计</router-link>
      </div>
      <div class="nav-user">
        <span class="username">{{ user?.username }}</span>
        <button @click="logout" class="btn btn-secondary btn-sm">退出</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { getUser, removeToken } from '../utils/helpers'

const router = useRouter()
const user = computed(() => getUser())

function logout() {
  removeToken()
  router.push('/login')
}
</script>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 24px;
}
.nav-brand {
  font-size: 18px;
  font-weight: 700;
  color: #4f46e5;
}
.nav-links {
  display: flex;
  gap: 8px;
  flex: 1;
}
.nav-link {
  padding: 8px 16px;
  border-radius: 8px;
  color: #6b7280;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}
.nav-link:hover {
  background: #f3f4f6;
  color: #374151;
}
.nav-link.active {
  background: #eef2ff;
  color: #4f46e5;
}
.nav-user {
  display: flex;
  align-items: center;
  gap: 12px;
}
.username {
  font-size: 14px;
  color: #374151;
}
@media (max-width: 600px) {
  .nav-container {
    flex-wrap: wrap;
    gap: 12px;
  }
  .nav-links {
    order: 3;
    width: 100%;
  }
}
</style>
