<template>
  <div class="notification">
    <div
      v-for="(n, idx) in notifications"
      :key="idx"
      class="notification-item"
      :class="{ persistent: n.persistent }"
    >
      <span>{{ n.message }}</span>
      <button v-if="n.persistent && n.retry" @click="n.retry()">重试</button>
      <button v-if="n.persistent" @click="remove(idx)">关闭</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  notifications: { type: Array, default: () => [] }
})
const emit = defineEmits(['remove'])
function remove(idx) {
  emit('remove', idx)
}
</script>
