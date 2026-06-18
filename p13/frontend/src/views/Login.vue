<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="full-width" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="auth-footer">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { login } from '../api/auth';

const router = useRouter();
const route = useRoute();
const formRef = ref(null);
const showNotification = inject('showNotification');
const resetErrorCount = inject('resetErrorCount');
const incrementErrorCount = inject('incrementErrorCount');

const loading = ref(false);
const form = ref({
  email: '',
  password: ''
});

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
};

const handleLogin = async () => {
  try {
    await formRef.value.validate();
  } catch (err) {
    return;
  }
  
  loading.value = true;
  try {
    const data = await login(form.value);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    resetErrorCount();
    ElMessage.success('登录成功');
    const redirect = route.query.redirect || '/';
    router.push(redirect);
  } catch (err) {
    incrementErrorCount();
    const errorMsg = err.response?.data?.error || '登录失败';
    showNotification(errorMsg, 'warning');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  width: 400px;
}

.auth-card h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.full-width {
  width: 100%;
}

.auth-footer {
  text-align: center;
  margin-top: 20px;
  color: #909399;
}

.auth-footer a {
  color: #409eff;
  text-decoration: none;
}
</style>
