<template>
  <div id="app">
    <global-notification ref="notificationRef" />
    <router-view />
  </div>
</template>

<script setup>
import { provide, ref } from 'vue';
import GlobalNotification from './components/GlobalNotification.vue';

const notificationRef = ref(null);

const showNotification = (message, type = 'warning') => {
  if (notificationRef.value) {
    notificationRef.value.show(message, type);
  }
};

const incrementErrorCount = () => {
  if (notificationRef.value) {
    notificationRef.value.incrementErrorCount();
  }
};

const resetErrorCount = () => {
  if (notificationRef.value) {
    notificationRef.value.resetErrorCount();
  }
};

provide('showNotification', showNotification);
provide('incrementErrorCount', incrementErrorCount);
provide('resetErrorCount', resetErrorCount);
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
