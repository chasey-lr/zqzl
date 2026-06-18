<template>
  <div>
    <Navbar />
    <div class="container">
      <div class="page-header">
        <h2>数据统计</h2>
        <span v-if="streak > 0" class="streak-badge">🔥 连续打卡 {{ streak }} 天</span>
      </div>

      <FilterBar
        v-model:type="filterType"
        v-model:start-date="filterStartDate"
        v-model:end-date="filterEndDate"
        @change="loadStats"
      />

      <div class="stats-overview card">
        <div class="overview-item">
          <div class="overview-label">本周总时长</div>
          <div class="overview-value">{{ weekTotal }} 分钟</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">本周总卡路里</div>
          <div class="overview-value">{{ weekCalories }} 千卡</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">本月总时长</div>
          <div class="overview-value">{{ monthTotal }} 分钟</div>
        </div>
        <div class="overview-item">
          <div class="overview-label">本月总卡路里</div>
          <div class="overview-value">{{ monthCalories }} 千卡</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="card chart-card">
          <h3>本周运动时长（每日）</h3>
          <div class="chart-container">
            <Bar v-if="weekBarData" :data="weekBarData" :options="barOptions" />
          </div>
        </div>

        <div class="card chart-card">
          <h3>本月运动时长（每日）</h3>
          <div class="chart-container">
            <Bar v-if="monthBarData" :data="monthBarData" :options="barOptions" />
          </div>
        </div>

        <div class="card chart-card pie-card">
          <h3>运动类型时长占比</h3>
          <div class="chart-container">
            <Pie v-if="pieData" :data="pieData" :options="pieOptions" />
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { Bar, Pie } from 'vue-chartjs'
import Navbar from '../components/Navbar.vue'
import FilterBar from '../components/FilterBar.vue'
import { api, resetFailCount, incrementFailCount } from '../utils/api'
import { getTypeColor } from '../utils/helpers'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const loading = ref(false)
const streak = ref(0)
const weekTotal = ref(0)
const weekCalories = ref(0)
const monthTotal = ref(0)
const monthCalories = ref(0)
const weekDaily = ref({})
const monthDaily = ref({})
const typeStats = ref({})

const filterType = ref('all')
const filterStartDate = ref('')
const filterEndDate = ref('')

const weekBarData = computed(() => {
  if (!weekDaily.value || Object.keys(weekDaily.value).length === 0) return null
  const labels = Object.keys(weekDaily.value).map(d => {
    const date = new Date(d)
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  })
  const data = Object.values(weekDaily.value).map(v => v.duration)
  return {
    labels,
    datasets: [{
      label: '运动时长（分钟）',
      data,
      backgroundColor: '#4f46e5',
      borderRadius: 6
    }]
  }
})

const monthBarData = computed(() => {
  if (!monthDaily.value || Object.keys(monthDaily.value).length === 0) return null
  const labels = Object.keys(monthDaily.value).map(d => {
    const date = new Date(d)
    return date.getDate() + '日'
  })
  const data = Object.values(monthDaily.value).map(v => v.duration)
  return {
    labels,
    datasets: [{
      label: '运动时长（分钟）',
      data,
      backgroundColor: '#6366f1',
      borderRadius: 4
    }]
  }
})

const pieData = computed(() => {
  if (!typeStats.value || Object.keys(typeStats.value).length === 0) return null
  const types = Object.keys(typeStats.value)
  return {
    labels: types,
    datasets: [{
      data: types.map(t => typeStats.value[t].duration),
      backgroundColor: types.map(t => getTypeColor(t)),
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  }
})

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f3f4f6' }
    },
    x: {
      grid: { display: false }
    }
  }
}

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 16,
        usePointStyle: true,
        font: { size: 12 }
      }
    }
  }
}

async function loadStats() {
  loading.value = true
  try {
    const params = {}
    if (filterType.value && filterType.value !== 'all') {
      params.type = filterType.value
    }
    if (filterStartDate.value) params.startDate = filterStartDate.value
    if (filterEndDate.value) params.endDate = filterEndDate.value

    const res = await api.getStats(params)
    resetFailCount()
    weekDaily.value = res.weekDaily
    monthDaily.value = res.monthDaily
    typeStats.value = res.typeStats
    weekTotal.value = res.weekTotal
    weekCalories.value = res.weekCalories
    monthTotal.value = res.monthTotal
    monthCalories.value = res.monthCalories
    streak.value = res.streak
  } catch (e) {
    incrementFailCount()
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
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
.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  padding: 0;
  overflow: hidden;
}
.overview-item {
  padding: 20px;
  text-align: center;
}
.overview-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}
.overview-value {
  font-size: 20px;
  font-weight: 700;
  color: #4f46e5;
}
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.chart-card {
  display: flex;
  flex-direction: column;
}
.chart-card h3 {
  margin-bottom: 16px;
  font-size: 15px;
  color: #1f2937;
}
.chart-container {
  height: 260px;
}
.pie-card {
  grid-column: span 2;
}
.pie-card .chart-container {
  height: 320px;
}
@media (max-width: 800px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .pie-card {
    grid-column: span 1;
  }
}
</style>
