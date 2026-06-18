<template>
  <div class="calendar card">
    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth">‹</button>
      <h3>{{ currentYear }}年{{ currentMonth }}月</h3>
      <button class="nav-btn" @click="nextMonth">›</button>
    </div>
    <div class="calendar-grid">
      <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
      <div
        v-for="(cell, idx) in calendarCells"
        :key="idx"
        class="day-cell"
        :class="{
          'other-month': !cell.inMonth,
          'today': cell.isToday,
          'selected': cell.dateStr === selectedDate,
          'has-records': cell.hasRecords
        }"
        @click="cell.inMonth && selectDate(cell.dateStr)"
      >
        <span class="day-num">{{ cell.day }}</span>
        <div v-if="cell.hasRecords" class="dots">
          <span
            v-for="(color, i) in cell.dotColors"
            :key="i"
            class="dot"
            :style="{ background: color }"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { api } from '../utils/api'
import { formatDate, getTypeColor } from '../utils/helpers'

const props = defineProps({
  selectedDate: String
})
const emit = defineEmits(['update:selectedDate'])

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const calendarData = ref({})

const calendarCells = computed(() => {
  const cells = []
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value, 0)
  const startDay = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const todayStr = formatDate(new Date())

  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value - 1, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const d = new Date(currentYear.value, currentMonth.value - 2, day)
    cells.push({
      day,
      dateStr: formatDate(d),
      inMonth: false,
      isToday: false,
      hasRecords: false,
      dotColors: []
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(currentYear.value, currentMonth.value - 1, day)
    const dateStr = formatDate(d)
    const types = calendarData.value[dateStr] || []
    const colorSet = new Set(types.map(t => getTypeColor(t)))
    cells.push({
      day,
      dateStr,
      inMonth: true,
      isToday: dateStr === todayStr,
      hasRecords: types.length > 0,
      dotColors: Array.from(colorSet).slice(0, 4)
    })
  }

  const remaining = 42 - cells.length
  for (let day = 1; day <= remaining; day++) {
    const d = new Date(currentYear.value, currentMonth.value, day)
    cells.push({
      day,
      dateStr: formatDate(d),
      inMonth: false,
      isToday: false,
      hasRecords: false,
      dotColors: []
    })
  }

  return cells
})

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function selectDate(dateStr) {
  emit('update:selectedDate', dateStr)
}

async function loadCalendar() {
  try {
    const res = await api.getCalendar({
      year: currentYear.value,
      month: currentMonth.value
    })
    calendarData.value = res.calendar
  } catch (e) {}
}

watch([currentYear, currentMonth], loadCalendar)
onMounted(loadCalendar)

defineExpose({ refresh: loadCalendar })
</script>

<style scoped>
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.calendar-header h3 {
  font-size: 16px;
  color: #1f2937;
}
.nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
}
.nav-btn:hover {
  background: #e5e7eb;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.weekday {
  text-align: center;
  padding: 8px 0;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}
.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.day-cell:hover:not(.other-month) {
  background: #f3f4f6;
}
.day-cell.other-month {
  opacity: 0.35;
  cursor: default;
}
.day-cell.today {
  background: #eef2ff;
}
.day-cell.today .day-num {
  color: #4f46e5;
  font-weight: 600;
}
.day-cell.selected {
  background: #4f46e5;
}
.day-cell.selected .day-num {
  color: white;
}
.day-num {
  font-size: 14px;
  color: #374151;
}
.dots {
  display: flex;
  gap: 2px;
  margin-top: 2px;
}
.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
</style>
