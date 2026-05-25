<template>
  <div class="page-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form :model="searchForm" @finish="handleSearch">
        <a-row :gutter="[16, 0]">
          <!-- 始终显示的前2个搜索项 -->
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="姓名">
              <a-input v-model:value="searchForm.name" placeholder="请输入" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="手机号">
              <a-input v-model:value="searchForm.phone" placeholder="请输入" allow-clear />
            </a-form-item>
          </a-col>

          <!-- 移动端折叠区域 -->
          <template v-if="!isMobile || searchExpanded">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="所在地区">
                <a-cascader
                  v-model:value="searchForm.region"
                  :options="regionOptions"
                  placeholder="请选择省/市/区"
                  change-on-select
                  allow-clear
                  style="width: 100%"
                  @change="onSearchRegionChange"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="上级业务员">
                <a-select
                  v-model:value="searchForm.parent_id"
                  placeholder="姓名/手机号搜索"
                  allow-clear
                  style="width: 100%"
                  show-search
                  :filter-option="false"
                  :loading="parentSearchLoading"
                  :options="parentOptions"
                  :field-names="{ label: 'label', value: 'value' }"
                  @search="onSearchParentSearch"
                  @dropdown-visible-change="onSearchParentDropdownOpen"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="所属机构">
                <a-select
                  v-model:value="searchForm.institutionId"
                  placeholder="请选择"
                  allow-clear
                  style="width: 100%"
                  :options="institutionOptions"
                  :field-names="{ label: 'name', value: 'id' }"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="状态">
                <a-select v-model:value="searchForm.status" placeholder="请选择" allow-clear style="width: 100%">
                  <a-select-option value="normal">正常</a-select-option>
                  <a-select-option value="disabled">停用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </template>

          <a-col :xs="24" :sm="12" :md="8" :lg="6" class="search-btn-col">
            <a-form-item>
              <a-button type="primary" html-type="submit">查询</a-button>
              <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
              <a-button
                v-if="isMobile"
                type="link"
                size="small"
                style="margin-left: 4px"
                @click="searchExpanded = !searchExpanded"
              >
                {{ searchExpanded ? '收起' : '更多' }}
                <up-outlined v-if="searchExpanded" />
                <down-outlined v-else />
              </a-button>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </div>

    <!-- 表格区域 -->
    <div class="table-area">
      <div class="toolbar">
        <span class="total-tip">共 {{ pagination.total }} 条记录</span>
        <a-button type="primary" @click="router.push('/salespersons/new')">
          <plus-outlined /> 新增业务员
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        :scroll="{ x: 'max-content' }"
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
              <a-button type="link" size="small" @click="router.push(`/salespersons/${record.id}`)">详情</a-button>
              <template v-if="!isMobile">
                <a-button type="link" size="small" @click="router.push(`/salespersons/${record.id}/edit`)">编辑</a-button>
                <a-popconfirm
                  v-if="record.role !== 'super_admin'"
                  title="确定删除该业务员？若有下级则无法删除。"
                  @confirm="doDelete(record)"
                >
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-popconfirm>
              </template>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { PlusOutlined, UpOutlined, DownOutlined } from '@ant-design/icons-vue'
import { useIsMobile } from '@/composables/useIsMobile'
import {
  getSalespersonList,
  deleteSalesperson
} from '@/api/salesperson'
import { getInstitutionList } from '@/api/institution'
import { buildRegionOptions } from '@/utils/region'

const router = useRouter()
const { isMobile } = useIsMobile()
const searchExpanded = ref(false)

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

const columns = computed(() => {
  if (isMobile.value) {
    return [
      { title: '姓名', dataIndex: 'name', key: 'name' },
      { title: '手机号', dataIndex: 'phone', key: 'phone', width: 120 },
      { title: '操作', key: 'action', fixed: 'right', width: 60 }
    ]
  }
  return [
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    { title: '手机号', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '所在地区', key: 'region', width: 180 },
    { title: '所属机构', dataIndex: 'institution_name', key: 'institution_name', width: 140, ellipsis: true },
    { title: '上级业务员', dataIndex: 'parent_name', key: 'parent_name', width: 110 },
    { title: '状态', key: 'status', width: 80 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    { title: '操作', key: 'action', fixed: 'right', width: 130 }
  ]
})

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

// ===================== 上级业务员远程搜索（搜索栏用） =====================
const parentOptions = ref([])
const parentSearchLoading = ref(false)
let parentSearchTimer = null

/**
 * 加载第一页业务员数据作为搜索栏的上级选项
 */
async function loadParentOptions() {
  parentSearchLoading.value = true
  try {
    const res = await getSalespersonList({ page: 1, pageSize: 20 })
    parentOptions.value = (res.data?.list || []).map((s) => ({
      value: s.id,
      label: `${s.name} - ${s.phone}`
    }))
  } finally {
    parentSearchLoading.value = false
  }
}

/** 搜索栏：下拉打开时加载第一页 */
function onSearchParentDropdownOpen(open) {
  if (open) loadParentOptions()
}

/** 搜索栏：防抖搜索 */
function onSearchParentSearch(keyword) {
  clearTimeout(parentSearchTimer)
  parentSearchTimer = setTimeout(async () => {
    parentSearchLoading.value = true
    try {
      const res = await getSalespersonList({ page: 1, pageSize: 20, keyword })
      parentOptions.value = (res.data?.list || []).map((s) => ({
        value: s.id,
        label: `${s.name} - ${s.phone}`
      }))
    } finally {
      parentSearchLoading.value = false
    }
  }, 300)
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
  padding: 20px 24px 4px;
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
}
.search-btn-col {
  :deep(.ant-form-item) {
    margin-bottom: 16px;
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

@media (max-width: 767px) {
  .page-container { padding: 12px; }
  .search-area {
    padding: 16px 16px 4px;
    margin-bottom: 12px;
  }
  .table-area { padding: 12px; }
  .toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
