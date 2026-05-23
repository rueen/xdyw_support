<template>
  <div class="page-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="姓名">
          <a-input v-model:value="searchForm.name" placeholder="请输入" allow-clear style="width: 130px" />
        </a-form-item>
        <a-form-item label="手机号">
          <a-input v-model:value="searchForm.phone" placeholder="请输入" allow-clear style="width: 150px" />
        </a-form-item>
        <a-form-item label="所在地区">
          <a-cascader
            v-model:value="searchForm.region"
            :options="regionOptions"
            placeholder="请选择省/市/区"
            change-on-select
            allow-clear
            style="width: 220px"
            @change="onSearchRegionChange"
          />
        </a-form-item>
        <a-form-item label="上级业务员">
          <a-select
            v-model:value="searchForm.parent_id"
            placeholder="姓名/手机号搜索"
            allow-clear
            style="width: 180px"
            show-search
            :filter-option="false"
            :loading="parentSearchLoading"
            :options="parentOptions"
            :field-names="{ label: 'label', value: 'value' }"
            @search="onSearchParentSearch"
            @dropdown-visible-change="onSearchParentDropdownOpen"
          />
        </a-form-item>
        <a-form-item label="所属机构">
          <a-select
            v-model:value="searchForm.institutionId"
            placeholder="请选择"
            allow-clear
            style="width: 180px"
            :options="institutionOptions"
            :field-names="{ label: 'name', value: 'id' }"
          />
        </a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="searchForm.status" placeholder="请选择" allow-clear style="width: 110px">
            <a-select-option value="normal">正常</a-select-option>
            <a-select-option value="disabled">停用</a-select-option>
          </a-select>
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
        <a-button type="primary" @click="openCreateModal">
          <plus-outlined /> 新增业务员
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        :scroll="{ x: 1250 }"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'region'">
            {{ [record.province_name, record.city_name, record.district_name].filter(Boolean).join(' / ') || '-' }}
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'normal' ? 'green' : 'red'">
              {{ record.status === 'normal' ? '正常' : '停用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'role'">
            <a-tag :color="record.role === 'super_admin' ? 'gold' : 'default'">
              {{ record.role === 'super_admin' ? '超级管理员' : '业务员' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
              <a-popconfirm
                v-if="record.role !== 'super_admin'"
                title="确定删除该业务员？若有下级则无法删除。"
                @confirm="doDelete(record)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 新增/编辑 Modal -->
    <a-modal
      v-model:open="modalVisible"
      :title="editingRecord ? '编辑业务员' : '新增业务员'"
      :confirm-loading="submitLoading"
      destroy-on-close
      @ok="submitForm"
      @cancel="closeModal"
    >
      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        layout="vertical"
        style="margin-top: 16px"
      >
        <a-form-item label="姓名" name="name">
          <a-input v-model:value="form.name" placeholder="请输入" :maxlength="50" />
        </a-form-item>
        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="form.phone" placeholder="请输入" :maxlength="11" />
        </a-form-item>
        <a-form-item :label="editingRecord ? '新密码（不填则不修改）' : '密码'" :name="editingRecord ? undefined : 'password'">
          <a-input-password v-model:value="form.password" placeholder="6-50位" />
        </a-form-item>
        <a-form-item label="所在地区" name="region">
          <a-cascader
            v-model:value="form.region"
            :options="regionOptions"
            placeholder="请选择省/市/区"
            change-on-select
            style="width: 100%"
            @change="onFormRegionChange"
          />
        </a-form-item>
        <a-form-item label="所属机构" name="institutionId">
          <a-select
            v-model:value="form.institutionId"
            placeholder="请选择（选填）"
            allow-clear
            :options="institutionOptions"
            :field-names="{ label: 'name', value: 'id' }"
          />
        </a-form-item>
        <a-form-item label="上级业务员" name="parent_id">
          <a-select
            v-model:value="form.parent_id"
            placeholder="输入姓名或手机号搜索"
            allow-clear
            show-search
            :filter-option="false"
            :loading="parentSearchLoading"
            :options="parentOptions"
            :field-names="{ label: 'label', value: 'value' }"
            @search="onFormParentSearch"
            @dropdown-visible-change="onFormParentDropdownOpen"
          />
        </a-form-item>
        <a-form-item v-if="editingRecord" label="状态" name="status">
          <a-radio-group v-model:value="form.status">
            <a-radio value="normal">正常</a-radio>
            <a-radio value="disabled">停用</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import {
  getSalespersonList,
  createSalesperson,
  updateSalesperson,
  deleteSalesperson
} from '@/api/salesperson'
import { getInstitutionList } from '@/api/institution'
import { buildRegionOptions, findRegionOptions } from '@/utils/region'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

/** 当前登录用户的下拉选项 */
const currentUserOption = computed(() => ({
  value: userStore.userInfo?.id,
  label: `${userStore.userInfo?.name} - ${userStore.userInfo?.phone}`
}))

// ===================== 省市区数据 =====================
const regionOptions = buildRegionOptions()

// ===================== 机构数据 =====================
const institutionOptions = ref([])

/**
 * 加载机构下拉选项（仅正常状态）
 */
async function loadInstitutionOptions() {
  const res = await getInstitutionList({ page: 1, pageSize: 100, status: 'normal' })
  institutionOptions.value = res.data?.list || []
}

// ===================== 搜索 =====================
const searchForm = reactive({
  name: '',
  phone: '',
  region: [],
  parent_id: undefined,
  institutionId: undefined,
  status: undefined
})

// 搜索栏：Cascader value 为 code，传给列表 API
const searchRegionCodes = reactive({ provinceCode: '', cityCode: '', districtCode: '' })
function onSearchRegionChange(codes) {
  searchRegionCodes.provinceCode = codes?.[0] || ''
  searchRegionCodes.cityCode = codes?.[1] || ''
  searchRegionCodes.districtCode = codes?.[2] || ''
}

// 表单弹窗：selectedOptions 含 .value(code) 和 .name，供提交时使用
const formRegionSelected = ref([])
function onFormRegionChange(codes, selectedOptions) {
  formRegionSelected.value = selectedOptions || []
}

function handleSearch() {
  pagination.current = 1
  fetchList()
}

function resetSearch() {
  Object.assign(searchForm, { name: '', phone: '', region: [], parent_id: undefined, institutionId: undefined, status: undefined })
  Object.assign(searchRegionCodes, { provinceCode: '', cityCode: '', districtCode: '' })
  pagination.current = 1
  fetchList()
}

// ===================== 表格 =====================
const loading = ref(false)
const tableData = ref([])
const pagination = reactive({ current: 1, pageSize: 10, total: 0, showSizeChanger: true, showQuickJumper: true })

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
  { title: '所在地区', key: 'region', width: 180 },
  { title: '所属机构', dataIndex: 'institution_name', key: 'institution_name', width: 140, ellipsis: true },
  { title: '上级业务员', dataIndex: 'parent_name', key: 'parent_name', width: 110 },
  { title: '状态', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
  { title: '操作', key: 'action', fixed: 'right', width: 130 }
]

async function fetchList() {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize
    }
    if (searchForm.name) params.name = searchForm.name
    if (searchForm.phone) params.phone = searchForm.phone
    if (searchRegionCodes.provinceCode) params.provinceCode = searchRegionCodes.provinceCode
    if (searchRegionCodes.cityCode) params.cityCode = searchRegionCodes.cityCode
    if (searchRegionCodes.districtCode) params.districtCode = searchRegionCodes.districtCode
    if (searchForm.parent_id) params.parentId = searchForm.parent_id
    if (searchForm.institutionId) params.institutionId = searchForm.institutionId
    if (searchForm.status) params.status = searchForm.status

    const res = await getSalespersonList(params)
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

// ===================== 上级业务员远程搜索 =====================
const parentOptions = ref([])
const parentSearchLoading = ref(false)
/** 编辑时记录被编辑者的 ID，用于从上级选项中排除自身 */
const excludeId = ref(null)
let parentSearchTimer = null

/**
 * 将列表数据转为 select 选项，同时排除自身（编辑场景）
 * @param {Array} list
 * @returns {Array}
 */
function toParentOptions(list) {
  return list
    .filter((s) => s.id !== excludeId.value)
    .map((s) => ({ value: s.id, label: `${s.name} - ${s.phone}` }))
}

/**
 * 加载第一页业务员数据
 * @param {boolean} pinCurrentUser - 是否将当前用户置顶
 */
async function loadParentOptions(pinCurrentUser = false) {
  parentSearchLoading.value = true
  try {
    const res = await getSalespersonList({ page: 1, pageSize: 20 })
    const list = toParentOptions(res.data?.list || [])
    if (pinCurrentUser) {
      const currentId = currentUserOption.value.value
      const rest = list.filter((o) => o.value !== currentId)
      parentOptions.value = [currentUserOption.value, ...rest]
    } else {
      parentOptions.value = list
    }
  } finally {
    parentSearchLoading.value = false
  }
}

/**
 * 防抖搜索业务员
 * @param {string} keyword
 * @param {boolean} pinCurrentUser - 关键字为空时，是否将当前用户置顶
 */
function doParentSearch(keyword, pinCurrentUser) {
  clearTimeout(parentSearchTimer)
  if (!keyword) {
    loadParentOptions(pinCurrentUser)
    return
  }
  parentSearchTimer = setTimeout(async () => {
    parentSearchLoading.value = true
    try {
      const res = await getSalespersonList({ page: 1, pageSize: 20, keyword })
      parentOptions.value = toParentOptions(res.data?.list || [])
    } finally {
      parentSearchLoading.value = false
    }
  }, 300)
}

/** 搜索栏：下拉打开时加载第一页（不置顶当前用户） */
function onSearchParentDropdownOpen(open) {
  if (open) loadParentOptions(false)
}

/** 搜索栏：输入关键字搜索（不置顶） */
function onSearchParentSearch(keyword) {
  doParentSearch(keyword, false)
}

/** 表单弹窗：下拉打开时加载第一页，当前用户置顶 */
function onFormParentDropdownOpen(open) {
  if (open) loadParentOptions(true)
}

/** 表单弹窗：输入关键字搜索，清空时当前用户置顶 */
function onFormParentSearch(keyword) {
  doParentSearch(keyword, true)
}

/**
 * 编辑时将当前上级注入选项列表，确保回显正常
 * @param {object} record
 */
function injectParentOption(record) {
  if (!record?.parent_id) return
  const exists = parentOptions.value.some((o) => o.value === record.parent_id)
  if (!exists) {
    parentOptions.value = [{ value: record.parent_id, label: record.parent_name }, ...parentOptions.value]
  }
}

// ===================== 新增/编辑 =====================
const modalVisible = ref(false)
const editingRecord = ref(null)
const submitLoading = ref(false)
const formRef = ref()
const form = reactive({
  name: '',
  phone: '',
  password: '',
  region: [],
  institutionId: undefined,
  parent_id: undefined,
  status: 'normal'
})

const rules = {
  name: [{ required: true, message: '请输入姓名' }],
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
  ],
  password: [{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]
}

function openCreateModal() {
  editingRecord.value = null
  excludeId.value = null
  formRegionSelected.value = []
  form.name = ''
  form.phone = ''
  form.password = ''
  form.region = []
  form.institutionId = undefined
  form.parent_id = currentUserOption.value.value
  form.status = 'normal'
  // 确保 select 能显示当前用户的 label，而不是原始 ID
  parentOptions.value = [currentUserOption.value]
  modalVisible.value = true
}

function openEditModal(record) {
  editingRecord.value = record
  excludeId.value = record.id

  // GET 接口返回 province_code/province_name/city_code/city_name/district_code/district_name
  const regionCodes = [record.province_code, record.city_code, record.district_code].filter(Boolean)
  // 同步初始化 formRegionSelected，供提交时读取 code + name
  formRegionSelected.value = findRegionOptions(
    regionOptions,
    record.province_name,
    record.city_name,
    record.district_name
  )

  form.name = record.name
  form.phone = record.phone
  form.password = ''
  form.region = regionCodes
  form.institutionId = record.institution_id || undefined
  form.parent_id = record.parent_id
  form.status = record.status

  // 初始化选项列表（排除自身后注入当前上级，确保回显正常）
  parentOptions.value = []
  if (record.parent_id && record.parent_name) {
    injectParentOption(record)
  }
  modalVisible.value = true
}

async function submitForm() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    const [prov, city, dist] = formRegionSelected.value
    const payload = {
      name: form.name,
      phone: form.phone,
      province_code: prov?.value || '',
      province_name: prov?.name || '',
      city_code: city?.value || '',
      city_name: city?.name || '',
      district_code: dist?.value || '',
      district_name: dist?.name || '',
      parent_id: form.parent_id,
      status: form.status
    }
    if (form.institutionId) payload.institutionId = form.institutionId
    else if (editingRecord.value) payload.institutionId = null
    if (form.password) payload.password = form.password

    if (editingRecord.value) {
      await updateSalesperson(editingRecord.value.id, payload)
      message.success('业务员信息更新成功')
    } else {
      payload.password = form.password
      await createSalesperson(payload)
      message.success('业务员创建成功')
    }
    modalVisible.value = false
    fetchList()
  } finally {
    submitLoading.value = false
  }
}

function closeModal() {
  formRef.value?.resetFields()
}

async function doDelete(record) {
  await deleteSalesperson(record.id)
  message.success('删除成功')
  fetchList()
}

onMounted(() => {
  loadInstitutionOptions()
  fetchList()
})
</script>

<style lang="less" scoped>
.page-container { padding: 24px; }
.search-area {
  background: #fff;
  padding: 20px 24px;
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);

  :deep(.ant-form-inline) {
    gap: 16px;
  }

  :deep(.ant-form-inline .ant-form-item) {
    margin-bottom: 0;
    margin-right: 0;
  }
}
.table-area {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.total-tip { color: #666; font-size: 14px; }
</style>
