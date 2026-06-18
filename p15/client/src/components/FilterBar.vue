<template>
  <div class="filter-bar">
    <div class="filter-group">
      <label class="filter-label">运动类型</label>
      <select v-model="localType" class="select" @change="emitChange">
        <option value="all">全部</option>
        <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>
    <div class="filter-group">
      <label class="filter-label">开始日期</label>
      <input v-model="localStart" type="date" class="input" @change="emitChange" />
    </div>
    <div class="filter-group">
      <label class="filter-label">结束日期</label>
      <input v-model="localEnd" type="date" class="input" @change="emitChange" />
    </div>
    <button v-if="hasFilter" class="btn btn-secondary btn-sm" @click="clearFilter">清除筛选</button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '../utils/api'

const props = defineProps({
  type: String,
  startDate: String,
  endDate: String
})
const emit = defineEmits(['update:type', 'update:startDate', 'update:endDate', 'change'])

const types = ref([])
const localType = ref(props.type || 'all')
const localStart = ref(props.startDate || '')
const localEnd = ref(props.endDate || '')

const hasFilter = computed(() => {
  return localType.value !== 'all' || localStart.value || localEnd.value
})

function emitChange() {
  emit('update:type', localType.value)
  emit('update:startDate', localStart.value)
  emit('update:endDate', localEnd.value)
  emit('change')
}

function clearFilter() {
  localType.value = 'all'
  localStart.value = ''
  localEnd.value = ''
  emitChange()
}

async function loadTypes() {
  try {
    const res = await api.getTypes()
    types.value = res.types
  } catch (e) {}
}

watch(() => props.type, (v) => { localType.value = v || 'all' })
watch(() => props.startDate, (v) => { localStart.value = v || '' })
watch(() => props.endDate, (v) => { localEnd.value = v || '' })

onMounted(loadTypes)
</script>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  margin-bottom: 16px;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-label {
  font-size: 12px;
  color: #6b7280;
}
.filter-group .input,
.filter-group .select {
  width: 160px;
  padding: 8px 10px;
  font-size: 13px;
}
@media (max-width: 600px) {
  .filter-group .input,
  .filter-group .select {
    width: 100%;
  }
  .filter-group {
    flex: 1 1 45%;
  }
}
</style>
