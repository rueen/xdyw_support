<template>
  <div class="page-container">
    <a-spin :spinning="loading">
      <!-- 返回按钮 -->
      <div class="back-bar">
        <a-button @click="$router.back()">
          <arrow-left-outlined /> 返回列表
        </a-button>
      </div>

      <template v-if="record">
        <a-row :gutter="16">
          <!-- 左侧：基础信息 + 图片 -->
          <a-col :span="16">
            <!-- 基础信息 -->
            <a-card title="患者基本信息" class="info-card">
              <template #extra>
                <a-tag :color="RECORD_STATUS[record.status]?.color" style="font-size: 14px; padding: 2px 10px">
                  {{ RECORD_STATUS[record.status]?.label }}
                </a-tag>
              </template>
              <a-descriptions :column="2" bordered size="small">
                <a-descriptions-item label="患者姓名">{{ record.patient_name }}</a-descriptions-item>
                <a-descriptions-item label="手机号">{{ record.patient_phone }}</a-descriptions-item>
                <a-descriptions-item label="身份证号" :span="2">{{ record.patient_id_card }}</a-descriptions-item>
                <a-descriptions-item label="指派医生">{{ record.doctor_name }}</a-descriptions-item>
                <a-descriptions-item label="录入业务员">
                  <span>{{ record.salesperson_name }}</span>
                  <a-tag color="orange" v-if="record.institution_name" style="margin-left: 10px">{{ record.institution_name }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ record.created_at }}</a-descriptions-item>
                <a-descriptions-item label="更新时间">{{ record.updated_at }}</a-descriptions-item>
                <a-descriptions-item
                  v-if="record.status === 'pending_follow_up' && record.next_follow_up_time"
                  label="下次复诊日期"
                  :span="2"
                >
                  <a-tag color="purple">{{ record.next_follow_up_time }}</a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="付费状态" :span="2">
                  <a-tag :color="PAYMENT_STATUS[record.payment_status]?.color">
                    {{ PAYMENT_STATUS[record.payment_status]?.label || '-' }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="病情描述" :span="2">
                  <div style="white-space: pre-wrap">{{ record.description || '（暂无描述）' }}</div>
                </a-descriptions-item>
              </a-descriptions>
            </a-card>

            <!-- 照片 -->
            <a-card v-if="record.photos && record.photos.length > 0" title="病例照片" class="info-card">
              <a-image-preview-group>
                <a-space wrap>
                  <a-image
                    v-for="(url, idx) in record.photos"
                    :key="idx"
                    :src="url"
                    width="100"
                    height="100"
                    style="object-fit: cover; border-radius: 4px"
                  />
                </a-space>
              </a-image-preview-group>
            </a-card>

            <!-- 复诊记录 -->
            <a-card
              v-if="record.follow_ups && record.follow_ups.length > 0"
              title="复诊记录"
              class="info-card"
            >
              <a-table
                :columns="followUpColumns"
                :data-source="record.follow_ups"
                :pagination="false"
                row-key="id"
                size="small"
              />
            </a-card>
          </a-col>

          <!-- 右侧：操作栏 + 操作日志 -->
          <a-col :span="8">
            <!-- 操作区域 -->
            <a-card title="病例操作" class="info-card">
              <a-space direction="vertical" style="width: 100%" :size="10">
                <!-- 医生判读 -->
                <template v-if="isDoctor && record.status === 'pending_review'">
                  <a-button type="primary" block style="background: #52c41a; border-color: #52c41a" @click="doReview('review_suitable')">
                    <check-outlined /> 符合用药
                  </a-button>
                  <a-button danger block @click="doReview('review_unsuitable')">
                    <close-outlined /> 不符合用药
                  </a-button>
                  <a-button block style="background: #fa8c16; border-color: #fa8c16; color: #fff" @click="openIncompleteModal">
                    <exclamation-outlined /> 资料不全
                  </a-button>
                </template>

                <!-- 业务员本人 / 超管：已就诊（suitable） -->
                <a-button
                  v-if="canOperate && record.status === 'suitable'"
                  type="primary"
                  block
                  style="background: #722ed1; border-color: #722ed1"
                  @click="doVisited"
                >
                  <medicine-box-outlined /> 已就诊
                </a-button>

                <!-- 业务员本人 / 超管：已复诊（pending_follow_up） -->
                <a-button
                  v-if="canOperate && record.status === 'pending_follow_up'"
                  type="primary"
                  block
                  @click="openFollowUpModal"
                >
                  <calendar-outlined /> 已复诊
                </a-button>

                <!-- 业务员本人 / 超管：补充资料（incomplete） -->
                <a-button
                  v-if="canOperate && record.status === 'incomplete'"
                  type="primary"
                  block
                  style="background: #fa8c16; border-color: #fa8c16"
                  @click="openSupplementModal"
                >
                  <edit-outlined /> 补充资料
                </a-button>

                <!-- 业务员本人 / 超管：已完诊 -->
                <a-button
                  v-if="canOperate && record.status !== 'completed'"
                  block
                  @click="doComplete"
                >
                  <check-circle-outlined /> 标记已完诊
                </a-button>

                <!-- 业务员本人 / 超管：已付费（待付费状态） -->
                <a-button
                  v-if="canOperate && record.payment_status === 'pending_payment'"
                  type="primary"
                  block
                  @click="openPayModal"
                >
                  <pay-circle-outlined /> 已付费
                </a-button>

                <!-- 业务员本人 / 超管：已退费（已付费状态） -->
                <a-button
                  v-if="canOperate && record.payment_status === 'paid'"
                  danger
                  block
                  @click="openRefundModal"
                >
                  <rollback-outlined /> 已退费
                </a-button>

                <a-empty v-if="!hasActions" description="暂无可执行操作" :image-style="{ height: '40px' }" />
              </a-space>
            </a-card>

            <!-- 操作日志 -->
            <a-card title="操作日志" class="info-card">
              <a-timeline>
                <a-timeline-item
                  v-for="op in record.operations"
                  :key="op.id"
                  :color="getOperationColor(op.operation)"
                >
                  <div class="timeline-content">
                    <div class="op-label">{{ OPERATION_LABELS[op.operation] || op.operation }}</div>
                    <div class="op-operator">
                      {{ op.operator_name }}（{{ op.operator_type === 'doctor' ? '医生' : '业务员' }}）
                    </div>
                    <div v-if="op.notes" class="op-notes">备注：{{ op.notes }}</div>
                    <template v-if="op.extra_data && (op.operation === 'pay' || op.operation === 'refund')">
                      <div v-if="op.extra_data.amount != null" class="op-extra">金额：¥{{ op.extra_data.amount }}</div>
                      <div v-if="op.extra_data.notes" class="op-extra">说明：{{ op.extra_data.notes }}</div>
                      <div v-if="op.extra_data.vouchers?.length" class="op-vouchers">
                        <a-image-preview-group>
                          <a-image
                            v-for="(url, idx) in op.extra_data.vouchers"
                            :key="idx"
                            :src="url"
                            :width="48"
                            :height="48"
                          />
                        </a-image-preview-group>
                      </div>
                    </template>
                    <div class="op-time">{{ op.created_at }}</div>
                  </div>
                </a-timeline-item>
              </a-timeline>
            </a-card>
          </a-col>
        </a-row>
      </template>
    </a-spin>

    <!-- 资料不全备注 Modal -->
    <a-modal
      v-model:open="incompleteModalVisible"
      title="标记资料不全"
      :confirm-loading="submitLoading"
      @ok="submitIncomplete"
    >
      <a-form layout="vertical" style="margin-top: 16px">
        <a-form-item label="备注（请说明缺少哪些资料）" required>
          <a-textarea
            v-model:value="incompleteNotes"
            placeholder="请填写备注（最多300字）"
            :maxlength="300"
            :rows="4"
            show-count
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 已复诊 Modal -->
    <a-modal
      v-model:open="followUpModalVisible"
      title="记录复诊"
      :confirm-loading="submitLoading"
      @ok="submitFollowUp"
    >
      <a-form layout="vertical" style="margin-top: 16px">
        <a-form-item label="本次复诊日期" required>
          <a-date-picker
            v-model:value="followUpForm.followUpTime"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="复诊备注">
          <a-textarea
            v-model:value="followUpForm.notes"
            placeholder="可填写复诊情况（最多300字）"
            :maxlength="300"
            :rows="3"
            show-count
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 补充资料 Modal -->
    <a-modal
      v-model:open="supplementModalVisible"
      title="补充资料"
      width="640px"
      :confirm-loading="submitLoading"
      @ok="submitSupplement"
    >
      <a-form layout="vertical" style="margin-top: 16px">
        <a-form-item label="补充描述">
          <a-textarea
            v-model:value="supplementForm.description"
            placeholder="补充病情描述（最多300字）"
            :maxlength="300"
            :rows="4"
            show-count
          />
        </a-form-item>
        <a-form-item label="补充照片">
          <image-upload v-model="supplementForm.photos" :max-count="10" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 已付费 Modal -->
    <a-modal
      v-model:open="payModalVisible"
      title="记录付费"
      width="560px"
      :confirm-loading="submitLoading"
      @ok="submitPay"
      @cancel="payForm.vouchers = []"
    >
      <a-form layout="vertical" style="margin-top: 16px">
        <a-form-item label="付款金额（元）" required>
          <a-input-number
            v-model:value="payForm.amount"
            placeholder="请输入"
            :min="0.01"
            :precision="2"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="付款凭证（最多3张）">
          <image-upload v-model="payForm.vouchers" :max-count="3" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea
            v-model:value="payForm.notes"
            placeholder="可填写备注（最多200字）"
            :maxlength="200"
            :rows="3"
            show-count
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 已退费 Modal -->
    <a-modal
      v-model:open="refundModalVisible"
      title="记录退费"
      width="560px"
      :confirm-loading="submitLoading"
      @ok="submitRefund"
      @cancel="refundForm.vouchers = []"
    >
      <a-form layout="vertical" style="margin-top: 16px">
        <a-form-item label="退款金额（元）">
          <a-input-number
            v-model:value="refundForm.amount"
            placeholder="选填"
            :min="0.01"
            :precision="2"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="退款凭证（最多3张）">
          <image-upload v-model="refundForm.vouchers" :max-count="3" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea
            v-model:value="refundForm.notes"
            placeholder="可填写备注（最多200字）"
            :maxlength="200"
            :rows="3"
            show-count
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationOutlined,
  MedicineBoxOutlined,
  CalendarOutlined,
  EditOutlined,
  CheckCircleOutlined,
  PayCircleOutlined,
  RollbackOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { RECORD_STATUS, PAYMENT_STATUS, OPERATION_LABELS } from '@/utils/constants'
import {
  getRecordDetail,
  reviewRecord,
  visitRecord,
  followUpRecord,
  completeRecord,
  supplementRecord,
  payRecord,
  refundRecord
} from '@/api/record'
import ImageUpload from '@/components/ImageUpload.vue'

const route = useRoute()
const userStore = useUserStore()

const isSuperAdmin = computed(() => userStore.isSuperAdmin)
const isDoctor = computed(() => userStore.isDoctor)
const isSalesperson = computed(() => userStore.isSalesperson)

const loading = ref(false)
const record = ref(null)

/** 当前病例是否由本人录入（业务员权限控制依据） */
const isOwnRecord = computed(() =>
  record.value?.salesperson_id === userStore.userInfo?.id
)

/** 当前登录者是否对本病例有操作权限（本人录入 或 超管） */
const canOperate = computed(() => isSuperAdmin.value || isOwnRecord.value)

/** 是否有可操作按钮 */
const hasActions = computed(() => {
  if (!record.value) return false
  const s = record.value.status
  const ps = record.value.payment_status
  if (isDoctor.value && s === 'pending_review') return true
  if (canOperate.value && s !== 'completed') return true
  if (canOperate.value && (ps === 'pending_payment' || ps === 'paid')) return true
  return false
})

/** 复诊记录表格列 */
const followUpColumns = [
  { title: '复诊日期', dataIndex: 'follow_up_time', key: 'follow_up_time', width: 110 },
  { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
  { title: '操作人', dataIndex: 'salesperson_name', key: 'salesperson_name', width: 90 },
  { title: '记录时间', dataIndex: 'created_at', key: 'created_at', width: 160 }
]

/** 根据操作类型返回 timeline 颜色 */
function getOperationColor(operation) {
  const colorMap = {
    create: 'blue',
    update: 'gray',
    review_suitable: 'green',
    review_unsuitable: 'red',
    review_incomplete: 'orange',
    supplement: 'orange',
    visited: 'purple',
    follow_up: 'blue',
    complete: 'gray',
    pay: 'green',
    refund: 'red'
  }
  return colorMap[operation] || 'blue'
}

async function fetchDetail() {
  loading.value = true
  try {
    const res = await getRecordDetail(route.params.id)
    record.value = res.data
  } finally {
    loading.value = false
  }
}

// ===================== 医生判读 =====================
async function doReview(operation) {
  if (operation !== 'review_incomplete') {
    const label = operation === 'review_suitable' ? '符合用药' : '不符合用药'
    Modal.confirm({
      title: `确认判读为「${label}」？`,
      onOk: async () => {
        await reviewRecord(record.value.id, { operation })
        message.success('操作成功')
        fetchDetail()
      }
    })
  }
}

const incompleteModalVisible = ref(false)
const incompleteNotes = ref('')
const submitLoading = ref(false)

function openIncompleteModal() {
  incompleteNotes.value = ''
  incompleteModalVisible.value = true
}

async function submitIncomplete() {
  if (!incompleteNotes.value.trim()) {
    message.warning('请填写备注说明缺少哪些资料')
    return
  }
  submitLoading.value = true
  try {
    await reviewRecord(record.value.id, { operation: 'review_incomplete', notes: incompleteNotes.value })
    message.success('已标记为资料不全')
    incompleteModalVisible.value = false
    fetchDetail()
  } finally {
    submitLoading.value = false
  }
}

// ===================== 业务员操作 =====================
function doVisited() {
  Modal.confirm({
    title: '确认标记为「已就诊」？',
    content: '操作后病例将进入待复诊状态',
    onOk: async () => {
      await visitRecord(record.value.id)
      message.success('已标记为已就诊')
      fetchDetail()
    }
  })
}

const followUpModalVisible = ref(false)
const followUpForm = reactive({ followUpTime: '', notes: '' })

function openFollowUpModal() {
  followUpForm.followUpTime = ''
  followUpForm.notes = ''
  followUpModalVisible.value = true
}

async function submitFollowUp() {
  if (!followUpForm.followUpTime) {
    message.warning('请选择复诊日期')
    return
  }
  submitLoading.value = true
  try {
    await followUpRecord(record.value.id, { followUpTime: followUpForm.followUpTime, notes: followUpForm.notes })
    message.success('复诊记录已保存')
    followUpModalVisible.value = false
    fetchDetail()
  } finally {
    submitLoading.value = false
  }
}

function doComplete() {
  Modal.confirm({
    title: '确认标记为「已完诊」？',
    content: '已完诊的病例不可再进行其他操作',
    onOk: async () => {
      await completeRecord(record.value.id)
      message.success('已标记为已完诊')
      fetchDetail()
    }
  })
}

const supplementModalVisible = ref(false)
const supplementForm = reactive({ description: '', photos: [] })

function openSupplementModal() {
  supplementForm.description = record.value.description || ''
  supplementForm.photos = record.value.photos || []
  supplementModalVisible.value = true
}

async function submitSupplement() {
  if (!supplementForm.description && supplementForm.photos.length === 0) {
    message.warning('请至少填写描述或上传照片')
    return
  }
  submitLoading.value = true
  try {
    await supplementRecord(record.value.id, {
      description: supplementForm.description,
      photos: supplementForm.photos
    })
    message.success('资料补充成功，病例已重新进入待判读状态')
    supplementModalVisible.value = false
    fetchDetail()
  } finally {
    submitLoading.value = false
  }
}

// ===================== 已付费 =====================
const payModalVisible = ref(false)
const payForm = reactive({ amount: undefined, vouchers: [], notes: '' })

function openPayModal() {
  Object.assign(payForm, { amount: undefined, vouchers: [], notes: '' })
  payModalVisible.value = true
}

async function submitPay() {
  if (!payForm.amount || payForm.amount <= 0) {
    message.warning('请填写大于 0 的付款金额')
    return
  }
  submitLoading.value = true
  try {
    await payRecord(record.value.id, {
      amount: payForm.amount,
      vouchers: payForm.vouchers.length ? payForm.vouchers : undefined,
      notes: payForm.notes || undefined
    })
    message.success('已记录付费')
    payModalVisible.value = false
    fetchDetail()
  } finally {
    submitLoading.value = false
  }
}

// ===================== 已退费 =====================
const refundModalVisible = ref(false)
const refundForm = reactive({ amount: undefined, vouchers: [], notes: '' })

function openRefundModal() {
  Object.assign(refundForm, { amount: undefined, vouchers: [], notes: '' })
  refundModalVisible.value = true
}

async function submitRefund() {
  if (refundForm.amount != null && refundForm.amount <= 0) {
    message.warning('退款金额须大于 0')
    return
  }
  submitLoading.value = true
  try {
    await refundRecord(record.value.id, {
      amount: refundForm.amount || undefined,
      vouchers: refundForm.vouchers.length ? refundForm.vouchers : undefined,
      notes: refundForm.notes || undefined
    })
    message.success('已记录退费')
    refundModalVisible.value = false
    fetchDetail()
  } finally {
    submitLoading.value = false
  }
}

onMounted(fetchDetail)
</script>

<style lang="less" scoped>
.page-container {
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: #f0f2f5;
}
.back-bar {
  margin-bottom: 16px;
}
.info-card {
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}
.timeline-content {
  .op-label {
    font-weight: 600;
    font-size: 14px;
    color: #1a1a1a;
    margin-bottom: 2px;
  }
  .op-operator {
    color: #666;
    font-size: 13px;
  }
  .op-notes {
    color: #fa8c16;
    font-size: 13px;
    margin-top: 2px;
  }
  .op-extra {
    color: #666;
    font-size: 13px;
    margin-top: 2px;
  }
  .op-vouchers {
    margin-top: 6px;

    :deep(.ant-image-preview-group) {
      display: flex;
      flex-wrap: nowrap;
      gap: 6px;
    }

    :deep(.ant-image) {
      flex-shrink: 0;
      width: 48px !important;
      height: 48px !important;
      border-radius: 4px;
      overflow: hidden;
    }

    :deep(.ant-image-img) {
      width: 48px !important;
      height: 48px !important;
      object-fit: cover;
    }
  }
  .op-time {
    color: #bbb;
    font-size: 12px;
    margin-top: 2px;
  }
}
</style>
