<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-input">
            <el-input v-model="form.code" placeholder="请输入验证码" />
            <el-button 
              type="primary" 
              :disabled="codeDisabled" 
              @click="handleSendCode"
              :loading="sendingCode"
            >
              {{ codeBtnText }}
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="full-width" @click="handleRegister" :loading="loading">
            注册
          </el-button>
        </el-form-item>
      </el-form>
      <div class="auth-footer">
        已有账号？<router-link to="/login">立即登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { sendCode as sendCodeApi, register } from '../api/auth';

const router = useRouter();
const formRef = ref(null);
const showNotification = inject('showNotification');
const resetErrorCount = inject('resetErrorCount');
const incrementErrorCount = inject('incrementErrorCount');

const loading = ref(false);
const sendingCode = ref(false);
const codeDisabled = ref(false);
const countdown = ref(0);

const form = ref({
  email: '',
  code: '',
  password: ''
});

const codeBtnText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}秒后重发`;
  }
  return '获取验证码';
});

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
};

const handleSendCode = async () => {
  if (!form.value.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    ElMessage.warning('请先输入有效的邮箱地址');
    return;
  }
  
  sendingCode.value = true;
  try {
    const data = await sendCodeApi(form.value.email);
    ElMessage.success(data.message);
    codeDisabled.value = true;
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
        codeDisabled.value = false;
      }
    }, 1000);
  } catch (err) {
    incrementErrorCount();
    const errorMsg = err.response?.data?.error || '发送验证码失败';
    showNotification(errorMsg, 'warning');
  } finally {
    sendingCode.value = false;
  }
};

const handleRegister = async () => {
  try {
    await formRef.value.validate();
  } catch (err) {
    return;
  }
  
  loading.value = true;
  try {
    const data = await register(form.value);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    resetErrorCount();
    ElMessage.success('注册成功');
    router.push('/');
  } catch (err) {
    incrementErrorCount();
    const errorMsg = err.response?.data?.error || '注册失败';
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
  width: 420px;
}

.auth-card h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
}

.code-input {
  display: flex;
  gap: 10px;
}

.code-input .el-input {
  flex: 1;
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
