<template>
  <div class="page-container">
    <!-- 搜索区域 -->
    <div class="search-area">
      <a-form layout="inline" :model="searchForm" @finish="handleSearch">
        <a-form-item label="机构名称">
          <a-input v-model:value="searchForm.name" placeholder="请输入" allow-clear style="width: 180px" />
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
          <plus-outlined /> 新增机构
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        @change="onTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'normal' ? 'green' : 'red'">
              {{ record.status === 'normal' ? '正常' : '停用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openEditModal(record)">编辑</a-button>
              <a-popconfirm
                title="确定删除该机构？若该机构下还有关联的业务员，将自动解除关联。"
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
      :title="editingRecord ? '编辑机构' : '新增机构'"
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
        <a-form-item label="机构名称" name="name">
          <a-input v-model:value="form.name" placeholder="请输入" :maxlength="100" />
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
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import {
  getInstitutionList,
  createInstitution,
  updateInstitution,
  deleteInstitution
} from '@/api/institution'

// ===================== 搜索 =====================
const searchForm = reactive({ name: '', status: undefined })

function handleSearch() {
  pagination.current = 1
  fetchList()
}

function resetSearch() {
  Object.assign(searchForm, { name: '', status: undefined })
  pagination.current = 1
  fetchList()
}

// ===================== 表格 =====================
const loading = ref(false)
const tableData = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true
})

const columns = [
  { title: '机构名称', dataIndex: 'name', key: 'name' },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  { title: '操作', key: 'action', width: 120 }
]

async function fetchList() {
  loading.value = true
  try {
    const params = { page: pagination.current, pageSize: pagination.pageSize }
    if (searchForm.name) params.name = searchForm.name
    if (searchForm.status) params.status = searchForm.status

    const res = await getInstitutionList(params)
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

// ===================== 新增/编辑 =====================
const modalVisible = ref(false)
const editingRecord = ref(null)
const submitLoading = ref(false)
const formRef = ref()
const form = reactive({ name: '', status: 'normal' })

const rules = {
  name: [{ required: true, message: '请输入机构名称' }]
}

function openCreateModal() {
  editingRecord.value = null
  Object.assign(form, { name: '', status: 'normal' })
  modalVisible.value = true
}

function openEditModal(record) {
  editingRecord.value = record
  Object.assign(form, { name: record.name, status: record.status })
  modalVisible.value = true
}

async function submitForm() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    const payload = { name: form.name }
    if (editingRecord.value) {
      payload.status = form.status
      await updateInstitution(editingRecord.value.id, payload)
      message.success('机构信息更新成功')
    } else {
      await createInstitution(payload)
      message.success('机构创建成功')
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
  await deleteInstitution(record.id)
  message.success('删除成功')
  fetchList()
}

onMounted(fetchList)
</script>

<style lang="less" scoped>
.page-container { padding: 24px; }
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
.total-tip { color: #666; font-size: 14px; }
</style>
