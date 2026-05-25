<template>
  <div class="page-container">
    <!-- 时间维度选择 -->
    <div class="time-filter-area">
      <a-radio-group v-model:value="rangeType" button-style="solid" @change="onRangeChange">
        <a-radio-button value="yesterday">昨日</a-radio-button>
        <a-radio-button value="today">今日</a-radio-button>
        <a-radio-button value="week">本周</a-radio-button>
        <a-radio-button value="month">本月</a-radio-button>
        <a-radio-button value="custom">自定义</a-radio-button>
      </a-radio-group>
      <a-range-picker
        v-if="rangeType === 'custom'"
        v-model:value="customRange"
        :value-format="'YYYY-MM-DD'"
        class="custom-range-picker"
        @change="onCustomRangeChange"
      />
    </div>

    <!-- 统计数据 -->
    <a-spin :spinning="loading">
      <a-row :gutter="[12, 12]" class="stats-row">
        <a-col :xs="12" :sm="12" :md="8" :lg="8" :xl="4">
          <div class="stat-card new-cases" @click="goRecords()">
            <div class="stat-icon"><plus-circle-outlined /></div>
            <div class="stat-info">
              <div class="stat-label">新增病例</div>
              <div class="stat-value">{{ stats.newCases }}</div>
            </div>
          </div>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="8" :xl="4">
          <div class="stat-card pending-review" @click="goRecords('pending_review')">
            <div class="stat-icon"><clock-circle-outlined /></div>
            <div class="stat-info">
              <div class="stat-label">待医生判读</div>
              <div class="stat-value">{{ stats.pendingReview }}</div>
            </div>
          </div>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="8" :xl="4">
          <div class="stat-card suitable" @click="goRecords('suitable')">
            <div class="stat-icon"><check-circle-outlined /></div>
            <div class="stat-info">
              <div class="stat-label">符合用药</div>
              <div class="stat-value">{{ stats.suitable }}</div>
            </div>
          </div>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="8" :xl="4">
          <div class="stat-card unsuitable" @click="goRecords('unsuitable')">
            <div class="stat-icon"><close-circle-outlined /></div>
            <div class="stat-info">
              <div class="stat-label">不符合用药</div>
              <div class="stat-value">{{ stats.unsuitable }}</div>
            </div>
          </div>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="8" :xl="4">
          <div class="stat-card visited" @click="goRecords('pending_follow_up')">
            <div class="stat-icon"><medicine-box-outlined /></div>
            <div class="stat-info">
              <div class="stat-label">已就诊</div>
              <div class="stat-value">{{ stats.visited }}</div>
            </div>
          </div>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="8" :xl="4">
          <div class="stat-card incomplete" @click="goRecords('incomplete')">
            <div class="stat-icon"><exclamation-circle-outlined /></div>
            <div class="stat-info">
              <div class="stat-label">资料不全</div>
              <div class="stat-value">{{ stats.incomplete }}</div>
            </div>
          </div>
        </a-col>
      </a-row>
    </a-spin>

    <!-- 时间范围说明 -->
    <div v-if="timeRangeText" class="time-range-tip">
      <info-circle-outlined /> 统计时间：{{ timeRangeText.start }} 至 {{ timeRangeText.end }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import {
  PlusCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MedicineBoxOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'
import { getStatistics } from '@/api/statistics'

const router = useRouter()

/**
 * 跳转病例管理并携带状态及时间筛选条件
 * @param {string} [status] - 病例状态值，不传则不带状态筛选
 */
function goRecords(status) {
  const query = {}
  if (status) query.status = status
  if (timeRangeText.value) {
    query.createdAtStart = timeRangeText.value.start
    query.createdAtEnd = timeRangeText.value.end
  }
  router.push({ path: '/records', query })
}

const rangeType = ref('today')
const customRange = ref([])
const loading = ref(false)
const stats = ref({
  newCases: 0,
  pendingReview: 0,
  suitable: 0,
  unsuitable: 0,
  incomplete: 0,
  visited: 0
})

/** 前端计算时间范围，格式 YYYY-MM-DD（后端自动按整天 00:00:00 ~ 23:59:59 处理） */
const timeRangeText = computed(() => {
  const today = dayjs()

  switch (rangeType.value) {
    case 'yesterday': {
      const yesterday = today.subtract(1, 'day')
      return {
        start: yesterday.format('YYYY-MM-DD'),
        end: yesterday.format('YYYY-MM-DD')
      }
    }
    case 'today':
      return {
        start: today.format('YYYY-MM-DD'),
        end: today.format('YYYY-MM-DD')
      }
    case 'week': {
      // 本周一：day() 返回 0=周日..6=周六，向前找到本周一
      const dayOfWeek = today.day()
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const monday = today.add(daysToMonday, 'day')
      return {
        start: monday.format('YYYY-MM-DD'),
        end: today.format('YYYY-MM-DD')
      }
    }
    case 'month':
      return {
        start: today.startOf('month').format('YYYY-MM-DD'),
        end: today.format('YYYY-MM-DD')
      }
    case 'custom':
      if (customRange.value?.length === 2) {
        return {
          start: customRange.value[0],
          end: customRange.value[1]
        }
      }
      return null
    default:
      return null
  }
})

async function fetchStats() {
  loading.value = true
  try {
    const params = { rangeType: rangeType.value }
    if (rangeType.value === 'custom' && customRange.value?.length === 2) {
      params.startDate = customRange.value[0]
      params.endDate = customRange.value[1]
    }
    const res = await getStatistics(params)
    const data = res.data
    stats.value = {
      newCases: data.newCases || 0,
      pendingReview: data.pendingReview || 0,
      suitable: data.suitable || 0,
      unsuitable: data.unsuitable || 0,
      incomplete: data.incomplete || 0,
      visited: data.visited || 0
    }
  } finally {
    loading.value = false
  }
}

function onRangeChange() {
  if (rangeType.value !== 'custom') {
    fetchStats()
  }
}

function onCustomRangeChange(val) {
  if (val && val.length === 2) {
    fetchStats()
  }
}

onMounted(fetchStats)
</script>

<style lang="less" scoped>

.time-filter-area {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.custom-range-picker {
  flex: 1;
  min-width: 200px;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  height: 100%;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    flex-shrink: 0;
  }

  .stat-label {
    font-size: 13px;
    color: #666;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
  }

  &.new-cases {
    .stat-icon { background: #e6f4ff; color: #1677ff; }
    .stat-value { color: #1677ff; }
  }
  &.pending-review {
    .stat-icon { background: #e6f7ff; color: #1890ff; }
    .stat-value { color: #1890ff; }
  }
  &.suitable {
    .stat-icon { background: #f6ffed; color: #52c41a; }
    .stat-value { color: #52c41a; }
  }
  &.unsuitable {
    .stat-icon { background: #fff1f0; color: #ff4d4f; }
    .stat-value { color: #ff4d4f; }
  }
  &.visited {
    .stat-icon { background: #f9f0ff; color: #722ed1; }
    .stat-value { color: #722ed1; }
  }
  &.incomplete {
    .stat-icon { background: #fff7e6; color: #fa8c16; }
    .stat-value { color: #fa8c16; }
  }
}

.time-range-tip {
  margin-top: 8px;
  color: #999;
  font-size: 13px;
  padding: 0 4px;
}

@media (max-width: 767px) {
  .time-filter-area {
    padding: 14px 16px;
    margin-bottom: 12px;
    gap: 10px;
  }

  .custom-range-picker {
    width: 100%;
    flex: none;
  }

  .stats-row {
    margin-bottom: 12px;
  }

  .stat-card {
    padding: 14px 12px;
    gap: 10px;
    border-radius: 8px;

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      font-size: 20px;
    }

    .stat-label {
      font-size: 12px;
      margin-bottom: 2px;
    }

    .stat-value {
      font-size: 24px;
    }
  }
}
</style>
