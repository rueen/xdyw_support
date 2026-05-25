<template>
  <div class="page-container">
    <a-spin :spinning="pageLoading">
      <div class="back-bar">
        <a-button @click="$router.back()">
          <arrow-left-outlined /> 返回
        </a-button>
      </div>

      <div class="form-card">
        <div class="form-card-title">{{ isEdit ? '编辑病例' : '新增病例' }}</div>
        <a-form
          ref="formRef"
          :model="form"
          :rules="rules"
          layout="vertical"
        >
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="患者姓名" name="patientName">
                <a-input v-model:value="form.patientName" placeholder="请输入" :maxlength="50" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="患者手机号" name="patientPhone">
                <a-input v-model:value="form.patientPhone" placeholder="请输入" :maxlength="11" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :xs="24" :sm="12">
              <a-form-item label="身份证号" name="patientIdCard">
                <a-input v-model:value="form.patientIdCard" placeholder="请输入18位身份证号" :maxlength="18" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12">
              <a-form-item label="指派医生" name="doctorId">
                <a-select v-model:value="form.doctorId" placeholder="请选择医生" style="width: 100%">
                  <a-select-option v-for="d in doctorOptions" :key="d.id" :value="d.id">
                    {{ d.name }}（{{ d.phone }}）
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="病情描述" name="description">
            <a-textarea
              v-model:value="form.description"
              placeholder="请描述病情（最多300字）"
              :maxlength="300"
              :rows="4"
              show-count
            />
          </a-form-item>
          <a-form-item label="照片（最多10张）" name="photos">
            <image-upload v-model="form.photos" :max-count="10" />
          </a-form-item>

          <div class="form-footer">
            <a-button style="margin-right: 12px" @click="$router.back()">取消</a-button>
            <a-button type="primary" :loading="submitLoading" @click="handleSubmit">
              {{ isEdit ? '保存修改' : '提交病例' }}
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
import { getRecordDetail, createRecord, updateRecord } from '@/api/record'
import { getActiveDoctors } from '@/api/doctor'
import ImageUpload from '@/components/ImageUpload.vue'

const route = useRoute()
const router = useRouter()

/** 是否为编辑模式（路由包含 :id 参数） */
const isEdit = computed(() => !!route.params.id)

const pageLoading = ref(false)
const submitLoading = ref(false)
const formRef = ref()
const form = reactive({
  patientName: '',
  patientPhone: '',
  patientIdCard: '',
  doctorId: undefined,
  description: '',
  photos: []
})

const rules = {
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

const doctorOptions = ref([])

async function fetchDoctors() {
  try {
    const res = await getActiveDoctors()
    doctorOptions.value = res.data || []
  } catch {
    // 静默失败
  }
}

/** 编辑模式：拉取原有数据并回填表单 */
async function fetchAndFill() {
  pageLoading.value = true
  try {
    const res = await getRecordDetail(route.params.id)
    const d = res.data
    Object.assign(form, {
      patientName: d.patient_name,
      patientPhone: d.patient_phone,
      patientIdCard: d.patient_id_card,
      doctorId: d.doctor_id,
      description: d.description || '',
      photos: d.photos || []
    })
  } finally {
    pageLoading.value = false
  }
}

async function handleSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    const payload = {
      patientName: form.patientName,
      patientPhone: form.patientPhone,
      patientIdCard: form.patientIdCard,
      doctorId: form.doctorId,
      description: form.description,
      photos: form.photos
    }
    if (isEdit.value) {
      await updateRecord(route.params.id, payload)
      message.success('病例更新成功')
      router.replace(`/records/${route.params.id}`)
    } else {
      await createRecord(payload)
      message.success('病例创建成功')
      router.replace('/records')
    }
  } finally {
    submitLoading.value = false
  }
}

onMounted(async () => {
  await fetchDoctors()
  if (isEdit.value) await fetchAndFill()
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
  max-width: 800px;
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
