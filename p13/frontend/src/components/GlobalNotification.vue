<template>
  <transition name="fade">
    <div v-if="visible" :class="['notification-bar', typeClass]" @click="handleClick">
      <span>{{ message }}</span>
      <el-button v-if="showRetry" type="danger" size="small" @click.stop="handleRetry">
        重试
      </el-button>
      <span class="close-btn" @click.stop="close">×</span>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue';

const visible = ref(false);
const message = ref('');
const type = ref('warning');
const errorCount = ref(0);
const showRetry = ref(false);
let timer = null;
let retryCallback = null;

const typeClass = computed(() => {
  if (errorCount.value >= 2) return 'notification-error';
  return type.value === 'warning' ? 'notification-warning' : 'notification-error';
});

const show = (msg, t = 'warning') => {
  message.value = msg;
  type.value = t;
  visible.value = true;
  
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    close();
  }, 5000);
};

const incrementErrorCount = () => {
  errorCount.value++;
  if (errorCount.value >= 2) {
    showRetry.value = true;
  }
};

const resetErrorCount = () => {
  errorCount.value = 0;
  showRetry.value = false;
};

const close = () => {
  visible.value = false;
  if (timer) clearTimeout(timer);
};

const setRetryCallback = (cb) => {
  retryCallback = cb;
};

const handleRetry = () => {
  if (retryCallback) {
    retryCallback();
  }
};

const handleClick = () => {};

defineExpose({
  show,
  incrementErrorCount,
  resetErrorCount,
  setRetryCallback
});
</script>

<style scoped>
.notification-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 12px 20px;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  cursor: pointer;
}

.notification-warning {
  background-color: #fdf6ec;
  color: #e6a23c;
  border-bottom: 1px solid #f5dab1;
}

.notification-error {
  background-color: #fef0f0;
  color: #f56c6c;
  border-bottom: 1px solid #fbc4c4;
}

.close-btn {
  position: absolute;
  right: 20px;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.6;
}

.close-btn:hover {
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
