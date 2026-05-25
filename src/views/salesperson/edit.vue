<template>
  <div class="page-container">
    <a-spin :spinning="pageLoading">
      <div class="back-bar">
        <a-button @click="$router.back()">
          <arrow-left-outlined /> 返回
        </a-button>
      </div>

      <div class="form-card">
        <div class="form-card-title">{{ isEdit ? '编辑业务员' : '新增业务员' }}</div>
        <a-form
          ref="formRef"
          :model="form"
          :rules="rules"
          layout="vertical"
        >
          <a-form-item label="姓名" name="name">
            <a-input v-model:value="form.name" placeholder="请输入" :maxlength="50" />
          </a-form-item>
          <a-form-item label="手机号" name="phone">
            <a-input v-model:value="form.phone" placeholder="请输入" :maxlength="11" />
          </a-form-item>
          <a-form-item :label="isEdit ? '新密码（不填则不修改）' : '密码'" :name="isEdit ? undefined : 'password'">
            <a-input-password v-model:value="form.password" placeholder="6-50位" />
          </a-form-item>
          <a-form-item label="所在地区" name="region">
            <a-cascader
              v-model:value="form.region"
              :options="regionOptions"
              placeholder="请选择省/市/区"
              change-on-select
              style="width: 100%"
              @change="onRegionChange"
            />
          </a-form-item>
          <a-form-item label="所属机构">
            <a-select
              v-model:value="form.institutionId"
              placeholder="请选择（选填）"
              allow-clear
              :options="institutionOptions"
              :field-names="{ label: 'name', value: 'id' }"
            />
          </a-form-item>
          <a-form-item label="上级业务员">
            <a-select
              v-model:value="form.parent_id"
              placeholder="输入姓名或手机号搜索"
              allow-clear
              show-search
              :filter-option="false"
              :loading="parentSearchLoading"
              :options="parentOptions"
              :field-names="{ label: 'label', value: 'value' }"
              @search="onParentSearch"
              @dropdown-visible-change="onParentDropdownOpen"
            />
          </a-form-item>
          <a-form-item v-if="isEdit" label="状态" name="status">
            <a-radio-group v-model:value="form.status">
              <a-radio value="normal">正常</a-radio>
              <a-radio value="disabled">停用</a-radio>
            </a-radio-group>
          </a-form-item>

          <div class="form-footer">
            <a-button style="margin-right: 12px" @click="$router.back()">取消</a-button>
            <a-button type="primary" :loading="submitLoading" @click="handleSubmit">
              {{ isEdit ? '保存修改' : '创建业务员' }}
            </a-button>
          </div>
        </a-form>
      </div>
    </a-spin>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import {
  getSalespersonDetail,
  getSalespersonList,
  createSalesperson,
  updateSalesperson
} from '@/api/salesperson'
import { getInstitutionList } from '@/api/institution'
import { buildRegionOptions, findRegionOptions } from '@/utils/region'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

/** 是否为编辑模式 */
const isEdit = computed(() => !!route.params.id)

/** 当前登录用户作为默认上级选项（新增时默认选中） */
const currentUserOption = computed(() => ({
  value: userStore.userInfo?.id,
  label: `${userStore.userInfo?.name} - ${userStore.userInfo?.phone}`
}))

const pageLoading = ref(false)
const submitLoading = ref(false)
const formRef = ref()
const regionOptions = buildRegionOptions()
const regionSelected = ref([])

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
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少6位' }
  ]
}

function onRegionChange(codes, selectedOptions) {
  regionSelected.value = selectedOptions || []
}

// ===================== 机构选项 =====================
const institutionOptions = ref([])

async function loadInstitutionOptions() {
  try {
    const res = await getInstitutionList({ page: 1, pageSize: 100, status: 'normal' })
    institutionOptions.value = res.data?.list || []
  } catch {
    // 静默失败
  }
}

// ===================== 上级业务员搜索 =====================
const parentOptions = ref([])
const parentSearchLoading = ref(false)
let parentSearchTimer = null

/**
 * 将列表转为 select 选项，排除自身（编辑场景）
 * @param {Array} list
 */
function toParentOptions(list) {
  return list
    .filter((s) => !route.params.id || s.id !== Number(route.params.id))
    .map((s) => ({ value: s.id, label: `${s.name} - ${s.phone}` }))
}

async function loadParentOptions(keyword = '', pinCurrentUser = false) {
  parentSearchLoading.value = true
  try {
    const params = { page: 1, pageSize: 20 }
    if (keyword) params.keyword = keyword
    const res = await getSalespersonList(params)
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

function onParentDropdownOpen(open) {
  if (open) loadParentOptions('', !isEdit.value)
}

function onParentSearch(keyword) {
  clearTimeout(parentSearchTimer)
  parentSearchTimer = setTimeout(() => loadParentOptions(keyword, !isEdit.value), 300)
}

// ===================== 编辑回填 =====================
async function fetchAndFill() {
  pageLoading.value = true
  try {
    const res = await getSalespersonDetail(route.params.id)
    const d = res.data
    const regionCodes = [d.province_code, d.city_code, d.district_code].filter(Boolean)
    regionSelected.value = findRegionOptions(regionOptions, d.province_name, d.city_name, d.district_name)
    Object.assign(form, {
      name: d.name,
      phone: d.phone,
      password: '',
      region: regionCodes,
      institutionId: d.institution_id || undefined,
      parent_id: d.parent_id,
      status: d.status
    })
    if (d.parent_id && d.parent_name) {
      parentOptions.value = [{ value: d.parent_id, label: `${d.parent_name}` }]
    }
  } finally {
    pageLoading.value = false
  }
}

// ===================== 提交 =====================
async function handleSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    const [prov, city, dist] = regionSelected.value
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
    else if (isEdit.value) payload.institutionId = null
    if (form.password) payload.password = form.password

    if (isEdit.value) {
      await updateSalesperson(route.params.id, payload)
      message.success('业务员信息更新成功')
      router.replace(`/salespersons/${route.params.id}`)
    } else {
      payload.password = form.password
      await createSalesperson(payload)
      message.success('业务员创建成功')
      router.replace('/salespersons')
    }
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  await Promise.all([loadInstitutionOptions()])
  if (isEdit.value) {
    await fetchAndFill()
  } else {
    form.parent_id = currentUserOption.value.value
    parentOptions.value = [currentUserOption.value]
  }
})
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
.form-card {
  background: #fff;
  border-radius: 8px;
  padding: 28px 32px 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  max-width: 600px;
}
.form-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.form-footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 767px) {
  .page-container {
    padding: 12px;
  }
  .form-card {
    padding: 16px;
    border-radius: 6px;
  }
  .form-footer {
    justify-content: stretch;
    flex-direction: column-reverse;
    gap: 8px;

    .ant-btn {
      width: 100%;
      margin-right: 0 !important;
    }
  }
}
</style>
