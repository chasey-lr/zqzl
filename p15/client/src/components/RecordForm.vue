<template>
  <div class="record-form card">
    <h3>{{ editingRecord ? '编辑打卡记录' : '添加今日打卡' }}</h3>
    <form @submit.prevent="handleSubmit">
      <div class="form-row">
        <div class="form-group" style="flex: 1">
          <label class="form-label">运动类型 *</label>
          <select v-if="!showCustomType" v-model="form.type" class="select" @change="onTypeChange">
            <option value="">请选择类型</option>
            <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
            <option value="__custom__">+ 自定义类型</option>
          </select>
          <div v-else style="display: flex; gap: 8px">
            <input v-model="customType" type="text" class="input" placeholder="输入新类型" />
            <button type="button" class="btn btn-secondary btn-sm" @click="cancelCustom">取消</button>
          </div>
        </div>
        <div class="form-group" style="width: 140px">
          <label class="form-label">时长(分钟) *</label>
          <input
            v-model.number="form.duration"
            type="number"
            min="1"
            step="1"
            class="input"
            placeholder="分钟"
            @input="updateEstimate"
          />
        </div>
        <div class="form-group" style="width: 140px">
          <label class="form-label">卡路里</label>
          <div style="position: relative">
            <input
              v-model.number="form.calories"
              type="number"
              min="0"
              step="1"
              class="input"
              :placeholder="estimatedCalories || '千卡'"
            />
            <span
              v-if="estimatedCalories && !form.calories"
              class="estimate-tip"
              :title="'预估: ' + estimatedCalories + ' 千卡（可修改）'"
            >
              ~{{ estimatedCalories }}
            </span>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group" style="flex: 1">
          <label class="form-label">日期</label>
          <input v-model="form.date" type="date" class="input" />
        </div>
        <div class="form-group" style="flex: 2">
          <label class="form-label">备注</label>
          <input v-model="form.remark" type="text" class="input" placeholder="可选" />
        </div>
      </div>
      <div class="form-actions">
        <button v-if="editingRecord" type="button" class="btn btn-secondary" @click="cancelEdit">取消</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          {{ submitting ? '提交中...' : (editingRecord ? '保存修改' : '提交打卡') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, inject } from 'vue'
import { api, resetFailCount, incrementFailCount } from '../utils/api'
import { formatDate } from '../utils/helpers'

const props = defineProps({
  editingRecord: Object
})
const emit = defineEmits(['submitted', 'canceled'])
const notify = inject('notify')

const types = ref([])
const showCustomType = ref(false)
const customType = ref('')
const estimatedCalories = ref(null)
const submitting = ref(false)

const form = reactive({
  type: '',
  duration: 30,
  calories: null,
  date: formatDate(new Date()),
  remark: ''
})

async function loadTypes() {
  try {
    const res = await api.getTypes()
    types.value = res.types
  } catch (e) {
    // ignore
  }
}

function onTypeChange() {
  if (form.type === '__custom__') {
    showCustomType.value = true
    form.type = ''
  } else {
    updateEstimate()
  }
}

function cancelCustom() {
  showCustomType.value = false
  customType.value = ''
}

async function updateEstimate() {
  const type = showCustomType.value ? customType.value : form.type
  if (type && form.duration > 0) {
    try {
      const res = await api.estimate(type, form.duration)
      estimatedCalories.value = res.calories
    } catch (e) {
      estimatedCalories.value = null
    }
  } else {
    estimatedCalories.value = null
  }
}

watch([() => form.duration, () => customType], updateEstimate)

watch(() => props.editingRecord, (val) => {
  if (val) {
    form.type = val.type
    form.duration = val.duration
    form.calories = val.calories
    form.date = formatDate(val.date)
    form.remark = val.remark || ''
    showCustomType.value = false
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.type = ''
  form.duration = 30
  form.calories = null
  form.date = formatDate(new Date())
  form.remark = ''
  showCustomType.value = false
  customType.value = ''
  estimatedCalories.value = null
}

function cancelEdit() {
  emit('canceled')
}

async function handleSubmit() {
  let finalType = showCustomType.value ? customType.value.trim() : form.type
  if (!finalType) {
    notify?.error('请选择或输入运动类型')
    return
  }
  if (!form.duration || form.duration <= 0 || !Number.isInteger(form.duration)) {
    notify?.error('运动时长必须为正整数')
    return
  }

  submitting.value = true
  try {
    if (showCustomType.value && customType.value.trim()) {
      try {
        await api.addType(customType.value.trim())
        await loadTypes()
      } catch (e) {}
    }

    const payload = {
      type: finalType,
      duration: form.duration,
      calories: form.calories,
      date: form.date,
      remark: form.remark
    }

    if (props.editingRecord) {
      await api.updateRecord(props.editingRecord.id, payload)
    } else {
      const res = await api.createRecord(payload)
      if (res.streakReset) {
        notify?.show('🎉 重新开始连续打卡！', { persistent: false })
      }
    }
    resetFailCount()
    emit('submitted')
    resetForm()
  } catch (e) {
    const count = incrementFailCount()
    notify?.error(e.message, {
      persistent: count >= 3,
      retry: count >= 3 ? handleSubmit : null
    })
  } finally {
    submitting.value = false
  }
}

onMounted(loadTypes)
</script>

<style scoped>
.record-form h3 {
  margin-bottom: 16px;
  color: #1f2937;
}
.form-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}
.estimate-tip {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #4f46e5;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
}
</style>
