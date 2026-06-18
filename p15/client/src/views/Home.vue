<template>
  <div>
    <Navbar />
    <div class="container">
      <div class="page-header">
        <h2>{{ selectedDate === todayStr ? '今日打卡' : selectedDate + ' 的打卡记录' }}</h2>
        <div class="header-right">
          <span v-if="streak > 0" class="streak-badge" :class="{ 'reset-tip': showStreakReset }" :title="'已连续打卡' + streak + '天'">
            🔥 连续打卡 {{ streak }} 天
          </span>
        </div>
      </div>

      <div class="stats-summary card">
        <div class="summary-item">
          <div class="summary-label">总运动时长</div>
          <div class="summary-value">{{ totalDuration }} <span class="summary-unit">分钟</span></div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="summary-label">消耗卡路里</div>
          <div class="summary-value">{{ totalCalories }} <span class="summary-unit">千卡</span></div>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-item">
          <div class="summary-label">打卡次数</div>
          <div class="summary-value">{{ totalRecords }} <span class="summary-unit">次</span></div>
        </div>
      </div>

      <div class="main-layout">
        <div class="left-panel">
          <RecordForm
            :editing-record="editingRecord"
            @submitted="onRecordSubmitted"
            @canceled="editingRecord = null"
          />

          <FilterBar
            v-model:type="filterType"
            v-model:start-date="filterStartDate"
            v-model:end-date="filterEndDate"
            @change="reloadRecords"
          />

          <div v-if="selectedDate !== todayStr" class="date-hint">
            <span>当前查看日期：{{ selectedDate }}</span>
            <button class="btn btn-secondary btn-sm" @click="goToday">回到今日</button>
          </div>

          <RecordList
            :records="records"
            :has-more="hasMore"
            :loading="loading"
            :loading-more="loadingMore"
            @edit="startEdit"
            @deleted="onRecordDeleted"
            @load-more="loadMore"
          />
        </div>
        <div class="right-panel">
          <CalendarView
            v-model:selected-date="selectedDate"
            ref="calendarRef"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import Navbar from '../components/Navbar.vue'
import RecordForm from '../components/RecordForm.vue'
import RecordList from '../components/RecordList.vue'
import CalendarView from '../components/CalendarView.vue'
import FilterBar from '../components/FilterBar.vue'
import { api, resetFailCount, incrementFailCount } from '../utils/api'
import { formatDate } from '../utils/helpers'

const calendarRef = ref(null)
const records = ref([])
const totalRecords = ref(0)
const totalDuration = ref(0)
const totalCalories = ref(0)
const streak = ref(0)
const showStreakReset = ref(false)
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const page = ref(1)
const editingRecord = ref(null)

const todayStr = formatDate(new Date())
const selectedDate = ref(todayStr)
const filterType = ref('all')
const filterStartDate = ref('')
const filterEndDate = ref('')

async function loadRecords(append = false) {
  if (append) {
    loadingMore.value = true
  } else {
    loading.value = true
  }
  try {
    const params = {
      page: append ? page.value + 1 : 1,
      pageSize: 10
    }
    if (selectedDate.value) {
      params.date = selectedDate.value
    }
    if (filterType.value && filterType.value !== 'all') {
      params.type = filterType.value
    }
    if (filterStartDate.value) params.startDate = filterStartDate.value
    if (filterEndDate.value) params.endDate = filterEndDate.value

    const res = await api.getRecords(params)
    resetFailCount()
    if (append) {
      records.value = [...records.value, ...res.records]
      page.value += 1
    } else {
      records.value = res.records
      page.value = 1
    }
    hasMore.value = res.hasMore
    totalRecords.value = res.total
    if (!filterType.value || filterType.value === 'all' && !filterStartDate.value && !filterEndDate.value) {
      totalDuration.value = res.totalDuration
      totalCalories.value = res.totalCalories
    } else {
      totalDuration.value = res.totalDuration
      totalCalories.value = res.totalCalories
    }
    if (res.streak > streak.value && streak.value > 0) {
      showStreakReset.value = false
    }
    streak.value = res.streak
  } catch (e) {
    incrementFailCount()
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function loadMore() {
  loadRecords(true)
}

function reloadRecords() {
  loadRecords(false)
}

function onRecordSubmitted() {
  editingRecord.value = null
  reloadRecords()
  calendarRef.value?.refresh()
}

function onRecordDeleted() {
  reloadRecords()
  calendarRef.value?.refresh()
}

function startEdit(record) {
  editingRecord.value = record
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function goToday() {
  selectedDate.value = todayStr
}

watch(selectedDate, () => {
  reloadRecords()
})

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.page-header h2 {
  color: #1f2937;
  font-size: 22px;
}
.header-right {
  display: flex;
  gap: 12px;
}
.stats-summary {
  display: flex;
  align-items: center;
  padding: 20px 24px;
}
.summary-item {
  flex: 1;
  text-align: center;
}
.summary-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 6px;
}
.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: #4f46e5;
}
.summary-unit {
  font-size: 14px;
  font-weight: 500;
  color: #9ca3af;
}
.summary-divider {
  width: 1px;
  height: 40px;
  background: #e5e7eb;
}
.main-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 20px;
}
.left-panel {
  min-width: 0;
}
.right-panel {
  position: sticky;
  top: 80px;
  align-self: flex-start;
}
.date-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #eef2ff;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  color: #4f46e5;
  font-size: 13px;
}
@media (max-width: 800px) {
  .main-layout {
    grid-template-columns: 1fr;
  }
  .right-panel {
    position: static;
  }
  .stats-summary {
    padding: 16px;
  }
  .summary-value {
    font-size: 22px;
  }
}
</style>
