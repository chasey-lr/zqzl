<template>
  <div class="record-list">
    <div v-if="records.length === 0 && !loading" class="empty-state">
      <p>暂无打卡记录，快来添加第一条吧！🏃</p>
    </div>
    <div v-for="record in records" :key="record.id" class="record-item card">
      <div class="record-left">
        <span class="type-tag" :style="{ background: getTypeColor(record.type) }">{{ record.type }}</span>
        <div class="record-info">
          <div class="record-main">
            <strong>{{ record.duration }}</strong> 分钟
            <span class="dot">·</span>
            <strong>{{ record.calories }}</strong> 千卡
          </div>
          <div class="record-meta">
            <span :title="formatDateTime(record.date)">{{ relativeTime(record.date) }}</span>
            <span v-if="record.remark" class="remark"> · {{ record.remark }}</span>
          </div>
        </div>
      </div>
      <div class="record-actions">
        <button class="btn btn-secondary btn-sm" @click="$emit('edit', record)">编辑</button>
        <button class="btn btn-danger btn-sm" @click="confirmDelete(record)">删除</button>
      </div>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-if="hasMore && !loading" class="load-more">
      <button class="btn btn-secondary" @click="$emit('loadMore')" :disabled="loadingMore">
        {{ loadingMore ? '加载中...' : '加载更多' }}
      </button>
    </div>

    <div v-if="deleteTarget" class="modal-overlay" @click.self="deleteTarget = null">
      <div class="modal">
        <h4>确认删除</h4>
        <p>确定要删除这条打卡记录吗？此操作无法撤销。</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="deleteTarget = null">取消</button>
          <button class="btn btn-danger" @click="doDelete" :disabled="deleting">
            {{ deleting ? '删除中...' : '删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { api, resetFailCount, incrementFailCount } from '../utils/api'
import { relativeTime, formatDateTime, getTypeColor } from '../utils/helpers'

defineProps({
  records: { type: Array, default: () => [] },
  hasMore: Boolean,
  loading: Boolean,
  loadingMore: Boolean
})
const emit = defineEmits(['edit', 'deleted', 'loadMore'])
const notify = inject('notify')

const deleteTarget = ref(null)
const deleting = ref(false)

function confirmDelete(record) {
  deleteTarget.value = record
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.deleteRecord(deleteTarget.value.id)
    resetFailCount()
    emit('deleted', deleteTarget.value.id)
    deleteTarget.value = null
  } catch (e) {
    const count = incrementFailCount()
    notify?.error(e.message, {
      persistent: count >= 3,
      retry: count >= 3 ? doDelete : null
    })
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 0;
}
.record-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}
.type-tag {
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}
.record-info {
  flex: 1;
  min-width: 0;
}
.record-main {
  font-size: 15px;
  color: #1f2937;
}
.record-main strong {
  font-size: 16px;
  color: #4f46e5;
}
.dot {
  color: #9ca3af;
  margin: 0 6px;
}
.record-meta {
  font-size: 13px;
  color: #6b7280;
  margin-top: 4px;
}
.remark {
  color: #9ca3af;
}
.record-actions {
  display: flex;
  gap: 8px;
}
.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}
.load-more {
  text-align: center;
  padding: 16px 0;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal {
  background: white;
  padding: 24px;
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
}
.modal h4 {
  margin-bottom: 12px;
  color: #1f2937;
}
.modal p {
  color: #6b7280;
  margin-bottom: 20px;
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
