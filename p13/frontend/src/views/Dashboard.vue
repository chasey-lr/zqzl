<template>
  <div class="dashboard">
    <header class="header">
      <div class="header-content">
        <h1 class="logo">短链接管理系统</h1>
        <div class="user-info">
          <span>{{ user?.email }}</span>
          <el-button type="danger" size="small" @click="logout">退出登录</el-button>
        </div>
      </div>
    </header>

    <main class="main-content">
      <div class="create-card">
        <h3>生成短链接</h3>
        <el-form :model="createForm" :inline="true" label-width="80px">
          <el-form-item label="长链接">
            <el-input 
              v-model="createForm.longUrl" 
              placeholder="请输入长链接" 
              style="width: 350px"
            />
          </el-form-item>
          <el-form-item label="自定义短码">
            <el-input 
              v-model="createForm.shortCode" 
              placeholder="选填，4-12位字母数字" 
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="过期时间">
            <el-date-picker
              v-model="createForm.expiresAt"
              type="datetime"
              placeholder="选填，永久有效"
              style="width: 200px"
              :disabled-date="disabledDate"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleCreate" :loading="creating">
              生成短链接
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="filter-card">
        <el-form :inline="true" label-width="60px">
          <el-form-item label="搜索">
            <el-input 
              v-model="searchKeyword" 
              placeholder="按短码或长链接搜索" 
              style="width: 250px"
              clearable
              @input="handleSearch"
            />
          </el-form-item>
          <el-form-item label="日期">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              @change="handleDateFilter"
            />
          </el-form-item>
          <el-form-item>
            <el-button @click="resetFilters">重置筛选</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="list-card">
        <div class="list-header">
          <h3>我的短链接</h3>
          <span class="total-count">共 {{ total }} 条</span>
        </div>
        
        <el-table 
          :data="links" 
          style="width: 100%"
          :default-sort="{ prop: 'createdAt', order: 'descending' }"
        >
          <el-table-column 
            prop="shortCode" 
            label="短码" 
            width="120"
          >
            <template #default="{ row }">
              <a :href="row.shortUrl" target="_blank" class="short-code-link">
                {{ row.shortCode }}
              </a>
            </template>
          </el-table-column>
          
          <el-table-column prop="longUrl" label="长链接" min-width="200">
            <template #default="{ row }">
              <el-tooltip :content="row.longUrl" placement="top">
                <span class="long-url">{{ row.longUrl }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          
          <el-table-column 
            prop="clickCount" 
            label="点击次数" 
            width="120"
            sortable
            :sort-orders="['ascending', 'descending', null]"
            @sort-change="handleSortChange"
          >
            <template #default="{ row }">
              <span class="click-count">{{ row.clickCount }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <span :class="['status-tag', getStatusClass(row.status)]">
                {{ getStatusText(row.status) }}
              </span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="showStats(row)">
                统计
              </el-button>
              <el-button size="small" type="success" link @click="handleEdit(row)">
                编辑
              </el-button>
              <el-button size="small" type="danger" link @click="handleDelete(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="hasMore" class="load-more">
          <el-button @click="loadMore" :loading="loading">加载更多</el-button>
        </div>
        
        <div v-if="links.length === 0 && !loading" class="empty-state">
          <el-empty description="暂无短链接" />
        </div>
      </div>
    </main>

    <el-dialog 
      v-model="editDialogVisible" 
      title="编辑短链接" 
      width="500px"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="短码">
          <el-input v-model="editForm.shortCode" disabled />
        </el-form-item>
        <el-form-item label="长链接">
          <el-input v-model="editForm.longUrl" style="width: 100%" />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker
            v-model="editForm.expiresAt"
            type="datetime"
            placeholder="永久有效"
            style="width: 100%"
            :disabled-date="disabledDate"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog 
      v-model="statsDialogVisible" 
      title="点击统计" 
      width="800px"
    >
      <div v-if="stats" class="stats-content">
        <div class="stats-overview">
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalClicks }}</div>
            <div class="stat-label">总点击次数</div>
          </div>
        </div>
        
        <div class="chart-section">
          <h4>最近7天点击量</h4>
          <div class="chart-container">
            <Bar :data="chartData" :options="chartOptions" />
          </div>
        </div>
        
        <div class="stats-details">
          <div class="detail-section">
            <h4>来源设备</h4>
            <div class="device-stats">
              <div class="device-item">
                <span class="device-label">PC</span>
                <el-progress 
                  :percentage="devicePercentages.PC" 
                  :stroke-width="12"
                  color="#409eff"
                />
                <span class="device-count">{{ stats.deviceStats.PC }}</span>
              </div>
              <div class="device-item">
                <span class="device-label">移动端</span>
                <el-progress 
                  :percentage="devicePercentages.Mobile" 
                  :stroke-width="12"
                  color="#67c23a"
                />
                <span class="device-count">{{ stats.deviceStats.Mobile }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>来源地区</h4>
            <div class="region-stats">
              <el-tag 
                v-for="(count, region) in stats.regionStats" 
                :key="region"
                style="margin: 4px"
              >
                {{ region }}: {{ count }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog 
      v-model="duplicateDialogVisible" 
      title="链接已存在" 
      width="500px"
    >
      <p>此链接已存在，是否复用已有短码？</p>
      <div class="duplicate-link" v-if="existingLink">
        <el-link :href="existingLink.shortUrl" target="_blank">
          {{ existingLink.shortUrl }}
        </el-link>
      </div>
      <template #footer>
        <el-button @click="duplicateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="useExistingLink">使用已有短码</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { createLink, getLinks, updateLink, deleteLink, getStats } from '../api/links';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const router = useRouter();
const showNotification = inject('showNotification');
const resetErrorCount = inject('resetErrorCount');
const incrementErrorCount = inject('incrementErrorCount');

const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));

const links = ref([]);
const loading = ref(false);
const creating = ref(false);
const saving = ref(false);
const page = ref(1);
const pageSize = 15;
const total = ref(0);
const hasMore = ref(false);

const searchKeyword = ref('');
const dateRange = ref([]);
const sortBy = ref('createdAt');
const sortOrder = ref('desc');

const createForm = reactive({
  longUrl: '',
  shortCode: '',
  expiresAt: ''
});

const editDialogVisible = ref(false);
const editForm = reactive({
  id: '',
  shortCode: '',
  longUrl: '',
  expiresAt: ''
});

const statsDialogVisible = ref(false);
const stats = ref(null);
const statsLoading = ref(false);

const duplicateDialogVisible = ref(false);
const existingLink = ref(null);

const chartData = computed(() => {
  if (!stats.value) return { labels: [], datasets: [] };
  return {
    labels: stats.value.last7Days.map(d => d.date.slice(5)),
    datasets: [
      {
        label: '点击量',
        data: stats.value.last7Days.map(d => d.count),
        backgroundColor: 'rgba(64, 158, 255, 0.6)',
        borderColor: 'rgba(64, 158, 255, 1)',
        borderWidth: 1
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  }
};

const devicePercentages = computed(() => {
  if (!stats.value) return { PC: 0, Mobile: 0 };
  const total = stats.value.deviceStats.PC + stats.value.deviceStats.Mobile;
  if (total === 0) return { PC: 0, Mobile: 0 };
  return {
    PC: Math.round((stats.value.deviceStats.PC / total) * 100),
    Mobile: Math.round((stats.value.deviceStats.Mobile / total) * 100)
  };
});

const disabledDate = (time) => {
  return time.getTime() < Date.now() - 86400000;
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusClass = (status) => {
  switch (status) {
    case 'active': return 'status-active';
    case 'expiring-soon': return 'status-expiring';
    case 'expired': return 'status-expired';
    default: return '';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'active': return '未过期';
    case 'expiring-soon': return '即将过期';
    case 'expired': return '已过期';
    default: return '未知';
  }
};

const fetchLinks = async (reset = false) => {
  if (reset) {
    page.value = 1;
    links.value = [];
  }
  
  loading.value = true;
  try {
    const params = {
      page: page.value,
      pageSize,
      search: searchKeyword.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    };
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0];
      params.endDate = dateRange.value[1];
    }
    
    const data = await getLinks(params);
    resetErrorCount();
    
    if (reset) {
      links.value = data.links;
    } else {
      links.value = [...links.value, ...data.links];
    }
    
    total.value = data.total;
    hasMore.value = data.hasMore;
  } catch (err) {
    incrementErrorCount();
    const errorMsg = err.response?.data?.error || '获取链接列表失败';
    showNotification(errorMsg, 'warning');
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  page.value++;
  fetchLinks(false);
};

const handleSearch = () => {
  fetchLinks(true);
};

const handleDateFilter = () => {
  fetchLinks(true);
};

const resetFilters = () => {
  searchKeyword.value = '';
  dateRange.value = [];
  sortBy.value = 'createdAt';
  sortOrder.value = 'desc';
  fetchLinks(true);
};

const handleSortChange = ({ prop, order }) => {
  sortBy.value = prop;
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc';
  fetchLinks(true);
};

const handleCreate = async () => {
  if (!createForm.longUrl) {
    ElMessage.warning('请输入长链接');
    return;
  }
  
  try {
    new URL(createForm.longUrl);
  } catch (err) {
    ElMessage.warning('请输入有效的URL');
    return;
  }
  
  creating.value = true;
  try {
    const data = await createLink({
      longUrl: createForm.longUrl,
      shortCode: createForm.shortCode || undefined,
      expiresAt: createForm.expiresAt || undefined
    });
    
    resetErrorCount();
    ElMessage.success('短链接生成成功');
    createForm.longUrl = '';
    createForm.shortCode = '';
    createForm.expiresAt = '';
    fetchLinks(true);
  } catch (err) {
    if (err.response?.status === 409) {
      existingLink.value = err.response.data.existingLink;
      duplicateDialogVisible.value = true;
    } else {
      incrementErrorCount();
      const errorMsg = err.response?.data?.error || '生成失败';
      showNotification(errorMsg, 'warning');
    }
  } finally {
    creating.value = false;
  }
};

const useExistingLink = () => {
  duplicateDialogVisible.value = false;
  ElMessage.success('已复用已有短码');
};

const handleEdit = (row) => {
  editForm.id = row.id;
  editForm.shortCode = row.shortCode;
  editForm.longUrl = row.longUrl;
  editForm.expiresAt = row.expiresAt;
  editDialogVisible.value = true;
};

const saveEdit = async () => {
  if (!editForm.longUrl) {
    ElMessage.warning('请输入长链接');
    return;
  }
  
  try {
    new URL(editForm.longUrl);
  } catch (err) {
    ElMessage.warning('请输入有效的URL');
    return;
  }
  
  saving.value = true;
  try {
    await updateLink(editForm.id, {
      longUrl: editForm.longUrl,
      expiresAt: editForm.expiresAt
    });
    resetErrorCount();
    ElMessage.success('更新成功');
    editDialogVisible.value = false;
    fetchLinks(true);
  } catch (err) {
    incrementErrorCount();
    const errorMsg = err.response?.data?.error || '更新失败';
    showNotification(errorMsg, 'warning');
  } finally {
    saving.value = false;
  }
};

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该短链接吗？此操作不可恢复。', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteLink(row.id);
      resetErrorCount();
      ElMessage.success('删除成功');
      fetchLinks(true);
    } catch (err) {
      incrementErrorCount();
      const errorMsg = err.response?.data?.error || '删除失败';
      showNotification(errorMsg, 'warning');
    }
  }).catch(() => {});
};

const showStats = async (row) => {
  statsDialogVisible.value = true;
  statsLoading.value = true;
  try {
    const data = await getStats(row.id);
    resetErrorCount();
    stats.value = data.stats;
  } catch (err) {
    incrementErrorCount();
    const errorMsg = err.response?.data?.error || '获取统计失败';
    showNotification(errorMsg, 'warning');
  } finally {
    statsLoading.value = false;
  }
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
};

onMounted(() => {
  fetchLinks(true);
});
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.create-card,
.filter-card,
.list-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.create-card h3,
.list-header h3 {
  margin: 0 0 20px 0;
  color: #303133;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.total-count {
  color: #909399;
  font-size: 14px;
}

.short-code-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.short-code-link:hover {
  text-decoration: underline;
}

.long-url {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
  color: #606266;
}

.click-count {
  font-weight: 600;
  color: #409eff;
}

.load-more {
  text-align: center;
  padding: 20px 0;
}

.empty-state {
  padding: 40px 0;
}

.stats-content {
  padding: 10px 0;
}

.stats-overview {
  margin-bottom: 30px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  color: #909399;
  margin-top: 8px;
}

.chart-section {
  margin-bottom: 30px;
}

.chart-section h4,
.detail-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.chart-container {
  height: 300px;
}

.stats-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
}

.device-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.device-item {
  display: flex;
  align-items: center;
  gap: 16px;
}

.device-label {
  width: 60px;
  color: #606266;
}

.device-item .el-progress {
  flex: 1;
}

.device-count {
  width: 40px;
  text-align: right;
  color: #909399;
}

.region-stats {
  display: flex;
  flex-wrap: wrap;
}

.duplicate-link {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  word-break: break-all;
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
