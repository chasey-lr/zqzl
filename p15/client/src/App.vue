<template>
  <div id="app">
    <Notification :notifications="notifications" @remove="removeNotif" />
    <router-view />
  </div>
</template>

<script setup>
import { ref, provide, onMounted } from 'vue'
import Notification from './components/Notification.vue'

const notifications = ref([])

function show(message, options = {}) {
  const notif = { message, persistent: false, ...options }
  notifications.value.push(notif)
  if (!options.persistent) {
    setTimeout(() => {
      const idx = notifications.value.indexOf(notif)
      if (idx !== -1) notifications.value.splice(idx, 1)
    }, 4000)
  }
  return notif
}

function removeNotif(idx) {
  notifications.value.splice(idx, 1)
}

function error(message, options = {}) {
  return show(message, options)
}

provide('notify', { show, error })

onMounted(() => {
  window.notify = { show, error }
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
