<template>
  <div class="page-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="患者姓名">
          <a-input
            v-model:value="searchForm.patientName"
            placeholder="请输入"
            allow-clear
            style="width: 140px"
          />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input
            v-model:value="searchForm.patientPhone"
            placeholder="请输入"
            allow-clear
            style="width: 150px"
          />
        </a-form-item>
        <a-form-item label="身份证号">
          <a-input
            v-model:value="searchForm.patientIdCard"
            placeholder="请输入"
            allow-clear
            style="width: 180px"
          />
        </a-form-item>
        <a-form-item v-if="!isDoctor" label="指派医生">
          <a-select
            v-model:value="searchForm.doctorId"
            placeholder="请选择"
            allow-clear
            style="width: 130px"
          >
            <a-select-option v-for="d in doctorOptions" :key="d.id" :value="d.id">
              {{ d.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="isSuperAdmin" label="所属机构">
          <a-select
            v-model:value="searchForm.institutionId"
            placeholder="请选择"
            allow-clear
            style="width: 160px"
            :options="institutionOptions"
            :field-names="{ label: 'name', value: 'id' }"
            @change="onInstitutionChange"
          />
        </a-form-item>
        <a-form-item v-if="!isDoctor" label="业务员">
          <a-select
            v-model:value="searchForm.salespersonId"
            placeholder="姓名/手机号搜索"
            allow-clear
            style="width: 180px"
            show-search
            :filter-option="false"
            :loading="salespersonSearchLoading"
            :options="salespersonOptions"
            :field-names="{ label: 'label', value: 'value' }"
            @search="onSalespersonSearch"
            @dropdown-visible-change="onSalespersonDropdownOpen"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select
            v-model:value="searchForm.status"
            placeholder="请选择"
            allow-clear
            style="width: 140px"
          >
            <a-select-option
              v-for="(v, k) in RECORD_STATUS"
              :key="k"
              :value="k"
            >
              {{ v.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="付费状态">
          <a-select
            v-model:value="searchForm.paymentStatus"
            placeholder="请选择"
            allow-clear
            style="width: 120px"
          >
            <a-select-option v-for="(v, k) in PAYMENT_STATUS" :key="k" :value="k">
              {{ v.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="创建时间">
          <a-range-picker
            v-model:value="createdAtRange"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            @change="onCreatedAtRangeChange"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">查询</a-button>
          <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 表格区域 -->
    <div class="table-area">
      <div class="toolbar">
        <span class="total-tip">共 {{ pagination.total }} 条记录</span>
        <a-button
          v-if="isSalesperson"
          type="primary"
          @click="openCreateModal"
        >
          <plus-outlined /> 新增病例
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        :scroll="{ x: 1200 }"
        @change="onTableChange"
      >
        <!-- 状态 Tag -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="RECORD_STATUS[record.status]?.color">
              {{ RECORD_STATUS[record.status]?.label || record.status }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'payment_status'">
            <a-tag :color="PAYMENT_STATUS[record.payment_status]?.color">
              {{ PAYMENT_STATUS[record.payment_status]?.label || record.payment_status || '-' }}
            </a-tag>
          </template>

          <!-- 复诊时间 -->
          <template v-else-if="column.key === 'next_follow_up_time'">
            <span v-if="record.status === 'pending_follow_up' && record.next_follow_up_time">
              {{ record.next_follow_up_time }}
            </span>
            <span v-else>-</span>
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'action'">
            <a-space wrap>
              <a-button type="link" size="small" @click="goDetail(record)">详情</a-button>

              <!-- 业务员本人 / 超管：编辑 -->
              <a-button
                v-if="(isSalesperson && isOwnRecord(record) || isSuperAdmin) && record.status !== 'completed'"
                type="link"
                size="small"
                @click="openEditModal(record)"
              >
                编辑
              </a-button>

              <!-- 医生：判读操作（仅 pending_review） -->
              <template v-if="isDoctor && record.status === 'pending_review'">
                <a-button type="link" size="small" style="color: #52c41a" @click="doReview(record, 'review_suitable')">
                  符合用药
                </a-button>
                <a-button type="link" size="small" style="color: #ff4d4f" @click="doReview(record, 'review_unsuitable')">
                  不符合用药
                </a-button>
                <a-button type="link" size="small" style="color: #fa8c16" @click="openIncompleteModal(record)">
                  资料不全
                </a-button>
              </template>

              <!-- 业务员本人 / 超管：已就诊（suitable） -->
              <a-button
                v-if="(isSalesperson && isOwnRecord(record) || isSuperAdmin) && record.status === 'suitable'"
                type="link"
                size="small"
                style="color: #722ed1"
                @click="doVisited(record)"
              >
                已就诊
              </a-button>

              <!-- 业务员本人 / 超管：已复诊（pending_follow_up） -->
              <a-button
                v-if="(isSalesperson && isOwnRecord(record) || isSuperAdmin) && record.status === 'pending_follow_up'"
                type="link"
                size="small"
                style="color: #1677ff"
                @click="openFollowUpModal(record)"
              >
                已复诊
              </a-button>

              <!-- 业务员本人 / 超管：补充资料（incomplete） -->
              <a-button
                v-if="(isSalesperson && isOwnRecord(record) || isSuperAdmin) && record.status === 'incomplete'"
                type="link"
                size="small"
                style="color: #fa8c16"
                @click="openSupplementModal(record)"
              >
                补充资料
              </a-button>

              <!-- 业务员本人 / 超管：已完诊 -->
              <a-button
                v-if="(isSalesperson && isOwnRecord(record) || isSuperAdmin) && record.status !== 'completed'"
                type="link"
                size="small"
                style="color: #999"
                @click="doComplete(record)"
              >
                已完诊
              </a-button>

              <!-- 业务员本人 / 超管：已付费（待付费状态） -->
              <a-button
                v-if="(isSalesperson && isOwnRecord(record) || isSuperAdmin) && record.payment_status === 'pending_payment'"
                type="link"
                size="small"
                style="color: #1677ff"
                @click="openPayModal(record)"
              >
                已付费
              </a-button>

              <!-- 业务员本人 / 超管：已退费（已付费状态） -->
              <a-button
                v-if="(isSalesperson && isOwnRecord(record) || isSuperAdmin) && record.payment_status === 'paid'"
                type="link"
                size="small"
                style="color: #ff4d4f"
                @click="openRefundModal(record)"
              >
                已退费
              </a-button>

              <!-- 超管：删除 -->
              <a-popconfirm
                v-if="isSuperAdmin"
                title="确定要删除该病例吗？"
                @confirm="doDelete(record)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑病例 Modal -->
    <a-modal
      v-model:open="recordModalVisible"
      :title="editingRecord ? '编辑病例' : '新增病例'"
      width="680px"
      :confirm-loading="submitLoading"
      @ok="submitRecordForm"
      @cancel="closeRecordModal"
    >
      <a-form
        ref="recordFormRef"
        :model="recordForm"
        :rules="recordRules"
        layout="vertical"
        style="margin-top: 16px"
      >
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="患者姓名" name="patientName">
              <a-input v-model:value="recordForm.patientName" placeholder="请输入" :maxlength="50" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="患者手机号" name="patientPhone">
              <a-input v-model:value="recordForm.patientPhone" placeholder="请输入" :maxlength="11" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="身份证号" name="patientIdCard">
              <a-input v-model:value="recordForm.patientIdCard" placeholder="请输入18位身份证号" :maxlength="18" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="指派医生" name="doctorId">
              <a-select v-model:value="recordForm.doctorId" placeholder="请选择医生">
                <a-select-option v-for="d in doctorOptions" :key="d.id" :value="d.id">
                  {{ d.name }}（{{ d.phone }}）
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="病情描述" name="description">
          <a-textarea
            v-model:value="recordForm.description"
            placeholder="请描述病情（最多300字）"
            :maxlength="300"
            :rows="4"
            show-count
          />
        </a-form-item>
        <a-form-item label="照片（最多10张）" name="photos">
          <image-upload v-model="recordForm.photos" :max-count="10" />
        </a-form-item>
      </a-form>
    </a-modal>

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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { RECORD_STATUS, PAYMENT_STATUS } from '@/utils/constants'
import {
  getRecordList,
  createRecord,
  updateRecord,
  deleteRecord,
  reviewRecord,
  visitRecord,
  followUpRecord,
  completeRecord,
  supplementRecord,
  payRecord,
  refundRecord
} from '@/api/record'
import { getActiveDoctors } from '@/api/doctor'
import { getInstitutionList } from '@/api/institution'
import { getSalespersonList } from '@/api/salesperson'
import ImageUpload from '@/components/ImageUpload.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isSuperAdmin = computed(() => userStore.isSuperAdmin)
const isDoctor = computed(() => userStore.isDoctor)
const isSalesperson = computed(() => userStore.isSalesperson)

/**
 * 判断某条病例是否由当前登录业务员本人录入
 * @param {object} record - 病例行数据
 * @returns {boolean}
 */
function isOwnRecord(record) {
  return record.salesperson_id === userStore.userInfo?.id
}

// ===================== 搜索 =====================
const searchForm = reactive({
  patientName: '',
  patientPhone: '',
  patientIdCard: '',
  doctorId: undefined,
  institutionId: undefined,
  salespersonId: undefined,
  status: undefined,
  paymentStatus: undefined,
  createdAtStart: undefined,
  createdAtEnd: undefined
})

/** 日期区间选择器双向绑定值（[start, end]），用于回显 */
const createdAtRange = ref([])

/**
 * 截取日期部分（兼容旧链接携带的时间格式）
 * @param {string} val - 日期或日期时间字符串
 * @returns {string}
 */
function toDateOnly(val) {
  return val ? val.slice(0, 10) : val
}

/**
 * 日期区间变化时同步到 searchForm
 * @param {string[]|null} val - 选中的日期范围
 */
function onCreatedAtRangeChange(val) {
  if (val && val.length === 2) {
    searchForm.createdAtStart = val[0]
    searchForm.createdAtEnd = val[1]
  } else {
    searchForm.createdAtStart = undefined
    searchForm.createdAtEnd = undefined
  }
}

function handleSearch() {
  pagination.current = 1
  fetchList()
}

function resetSearch() {
  Object.assign(searchForm, {
    patientName: '',
    patientPhone: '',
    patientIdCard: '',
    doctorId: undefined,
    institutionId: undefined,
    salespersonId: undefined,
    status: undefined,
    paymentStatus: undefined,
    createdAtStart: undefined,
    createdAtEnd: undefined
  })
  salespersonOptions.value = []
  createdAtRange.value = []
  pagination.current = 1
  fetchList()
}

// ===================== 表格 =====================
const loading = ref(false)
const tableData = ref([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showQuickJumper: true })

const columns = computed(() => {
  const base = [
    { title: '患者姓名', dataIndex: 'patient_name', key: 'patient_name', width: 100, ellipsis: true },
    { title: '手机号', dataIndex: 'patient_phone', key: 'patient_phone', width: 130 },
    { title: '身份证号', dataIndex: 'patient_id_card', key: 'patient_id_card', width: 180, ellipsis: true },
    { title: '指派医生', dataIndex: 'doctor_name', key: 'doctor_name', width: 100 },
    { title: '录入业务员', dataIndex: 'salesperson_name', key: 'salesperson_name', width: 110 },
    { title: '状态', key: 'status', width: 120 },
    { title: '付费状态', key: 'payment_status', width: 100 },
    { title: '下次复诊', key: 'next_follow_up_time', width: 110 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    { title: '操作', key: 'action', fixed: 'right', width: 280 }
  ]
  return base
})

async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...Object.fromEntries(Object.entries(searchForm).filter(([, v]) => v !== '' && v !== undefined))
    }
    const res = await getRecordList(params)
    tableData.value = res.data?.list || []
    pagination.total = res.data?.pagination?.total - 0 || 0
  } finally {
    loading.value = false
  }
}

function onTableChange(pag) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  fetchList()
}

function goDetail(record) {
  router.push(`/records/${record.id}`)
}

// ===================== 医生列表 =====================
const doctorOptions = ref([])
async function fetchDoctors() {
  try {
    const res = await getActiveDoctors()
    doctorOptions.value = res.data || []
  } catch {
    // 静默失败
  }
}

// ===================== 机构列表 =====================
const institutionOptions = ref([])

/**
 * 加载机构下拉选项（仅正常状态）
 */
async function fetchInstitutions() {
  try {
    const res = await getInstitutionList({ page: 1, pageSize: 100, status: 'normal' })
    institutionOptions.value = res.data?.list || []
  } catch {
    // 静默失败
  }
}

// ===================== 业务员搜索 =====================
const salespersonOptions = ref([])
const salespersonSearchLoading = ref(false)
let salespersonSearchTimer = null

/**
 * 构建业务员下拉查询参数
 * @param {string} [keyword] - 姓名/手机号关键字
 * @returns {object}
 */
function buildSalespersonSearchParams(keyword) {
  const params = { page: 1, pageSize: 20, status: 'normal' }
  if (keyword) params.keyword = keyword
  if (searchForm.institutionId) params.institutionId = searchForm.institutionId
  return params
}

/**
 * 加载业务员下拉选项
 * @param {string} [keyword] - 姓名/手机号关键字
 */
async function loadSalespersonOptions(keyword = '') {
  salespersonSearchLoading.value = true
  try {
    const res = await getSalespersonList(buildSalespersonSearchParams(keyword))
    salespersonOptions.value = (res.data?.list || []).map((s) => ({
      value: s.id,
      label: `${s.name} - ${s.phone}`
    }))
  } catch {
    salespersonOptions.value = []
  } finally {
    salespersonSearchLoading.value = false
  }
}

/**
 * 防抖搜索业务员
 * @param {string} keyword
 */
function onSalespersonSearch(keyword) {
  clearTimeout(salespersonSearchTimer)
  salespersonSearchTimer = setTimeout(() => {
    loadSalespersonOptions(keyword)
  }, 300)
}

/** 业务员下拉打开时加载第一页 */
function onSalespersonDropdownOpen(open) {
  if (open) loadSalespersonOptions()
}

/**
 * 所属机构变化时，清空已选业务员并刷新业务员下拉数据
 */
function onInstitutionChange() {
  searchForm.salespersonId = undefined
  salespersonOptions.value = []
}

// ===================== 新增/编辑病例 =====================
const recordModalVisible = ref(false)
const editingRecord = ref(null)
const submitLoading = ref(false)
const recordFormRef = ref()
const recordForm = reactive({
  patientName: '',
  patientPhone: '',
  patientIdCard: '',
  doctorId: undefined,
  description: '',
  photos: []
})

const recordRules = {
  patientName: [{ required: true, message: '请输入患者姓名' }],
  patientPhone: [
    { required: true, message: '请输入患者手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
  ],
  patientIdCard: [
    { required: true, message: '请输入身份证号' },
    { len: 18, message: '身份证号为18位' }
  ],
  doctorId: [{ required: true, message: '请选择指派医生' }]
}

function openCreateModal() {
  editingRecord.value = null
  Object.assign(recordForm, {
    patientName: '', patientPhone: '', patientIdCard: '',
    doctorId: undefined, description: '', photos: []
  })
  recordModalVisible.value = true
}

function openEditModal(record) {
  editingRecord.value = record
  Object.assign(recordForm, {
    patientName: record.patient_name,
    patientPhone: record.patient_phone,
    patientIdCard: record.patient_id_card,
    doctorId: record.doctor_id,
    description: record.description || '',
    photos: record.photos || []
  })
  recordModalVisible.value = true
}

async function submitRecordForm() {
  await recordFormRef.value.validate()
  submitLoading.value = true
  try {
    const payload = {
      patientName: recordForm.patientName,
      patientPhone: recordForm.patientPhone,
      patientIdCard: recordForm.patientIdCard,
      doctorId: recordForm.doctorId,
      description: recordForm.description,
      photos: recordForm.photos
    }
    if (editingRecord.value) {
      await updateRecord(editingRecord.value.id, payload)
      message.success('病例更新成功')
    } else {
      await createRecord(payload)
      message.success('病例创建成功')
    }
    recordModalVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

function closeRecordModal() {
  recordFormRef.value?.resetFields()
  recordForm.photos = []
}

// ===================== 医生判读 =====================
async function doReview(record, operation) {
  if (operation !== 'review_incomplete') {
    const label = operation === 'review_suitable' ? '符合用药' : '不符合用药'
    Modal.confirm({
      title: `确认判读为「${label}」？`,
      onOk: async () => {
        await reviewRecord(record.id, { operation })
        message.success('操作成功')
        fetchList()
      }
    })
  }
}

// 资料不全 Modal
const incompleteModalVisible = ref(false)
const incompleteNotes = ref('')
const currentRecord = ref(null)

function openIncompleteModal(record) {
  currentRecord.value = record
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
    await reviewRecord(currentRecord.value.id, {
      operation: 'review_incomplete',
      notes: incompleteNotes.value
    })
    message.success('已标记为资料不全')
    incompleteModalVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

// ===================== 业务员操作 =====================
async function doVisited(record) {
  Modal.confirm({
    title: '确认标记为「已就诊」？',
    content: '操作后病例将进入待复诊状态',
    onOk: async () => {
      await visitRecord(record.id)
      message.success('已标记为已就诊')
      fetchList()
    }
  })
}

// 已复诊 Modal
const followUpModalVisible = ref(false)
const followUpForm = reactive({ followUpTime: '', notes: '' })

function openFollowUpModal(record) {
  currentRecord.value = record
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
    await followUpRecord(currentRecord.value.id, {
      followUpTime: followUpForm.followUpTime,
      notes: followUpForm.notes
    })
    message.success('复诊记录已保存')
    followUpModalVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

// 已完诊
async function doComplete(record) {
  Modal.confirm({
    title: '确认标记为「已完诊」？',
    content: '已完诊的病例不可再进行其他操作',
    onOk: async () => {
      await completeRecord(record.id)
      message.success('已标记为已完诊')
      fetchList()
    }
  })
}

// 补充资料 Modal
const supplementModalVisible = ref(false)
const supplementForm = reactive({ description: '', photos: [] })

function openSupplementModal(record) {
  currentRecord.value = record
  supplementForm.description = record.description || ''
  supplementForm.photos = record.photos || []
  supplementModalVisible.value = true
}

async function submitSupplement() {
  if (!supplementForm.description && supplementForm.photos.length === 0) {
    message.warning('请至少填写描述或上传照片')
    return
  }
  submitLoading.value = true
  try {
    await supplementRecord(currentRecord.value.id, {
      description: supplementForm.description,
      photos: supplementForm.photos
    })
    message.success('资料补充成功，病例已重新进入待判读状态')
    supplementModalVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

// ===================== 删除 =====================
async function doDelete(record) {
  await deleteRecord(record.id)
  message.success('删除成功')
  fetchList()
}

// ===================== 已付费 =====================
const payModalVisible = ref(false)
const payForm = reactive({ amount: undefined, vouchers: [], notes: '' })

function openPayModal(record) {
  currentRecord.value = record
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
    await payRecord(currentRecord.value.id, {
      amount: payForm.amount,
      vouchers: payForm.vouchers.length ? payForm.vouchers : undefined,
      notes: payForm.notes || undefined
    })
    message.success('已记录付费')
    payModalVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

// ===================== 已退费 =====================
const refundModalVisible = ref(false)
const refundForm = reactive({ amount: undefined, vouchers: [], notes: '' })

function openRefundModal(record) {
  currentRecord.value = record
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
    await refundRecord(currentRecord.value.id, {
      amount: refundForm.amount || undefined,
      vouchers: refundForm.vouchers.length ? refundForm.vouchers : undefined,
      notes: refundForm.notes || undefined
    })
    message.success('已记录退费')
    refundModalVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

onMounted(() => {
  // 从工作台跳转时，自动带入状态及时间筛选条件
  if (route.query.status) {
    searchForm.status = route.query.status
  }
  if (route.query.createdAtStart && route.query.createdAtEnd) {
    const start = toDateOnly(route.query.createdAtStart)
    const end = toDateOnly(route.query.createdAtEnd)
    searchForm.createdAtStart = start
    searchForm.createdAtEnd = end
    createdAtRange.value = [start, end]
  }
  fetchList()
  if (!isDoctor.value) {
    fetchDoctors()
    if (isSuperAdmin.value) {
      fetchInstitutions()
    }
  }
})
</script>

<style lang="less" scoped>
.page-container {
  padding: 24px;
}
.search-area {
  background: #fff;
  padding: 20px 24px 8px;
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}
.table-area {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.total-tip {
  color: #666;
  font-size: 14px;
}
</style>
