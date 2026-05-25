<template>
  <div class="page-container">
    <a-card title="系统配置" class="config-card">
      <a-spin :spinning="loading">
        <a-form layout="vertical" style="max-width: 560px">
          <a-form-item>
            <template #label>
              <span>复诊间隔天数</span>
              <a-tooltip title="患者就诊后，系统自动计算下次复诊时间的间隔天数">
                <question-circle-outlined style="margin-left: 6px; color: #999" />
              </a-tooltip>
            </template>
            <a-input-number
              v-model:value="form.follow_up_interval_days"
              :min="1"
              :max="365"
              style="width: 180px"
              addon-after="天"
            />
            <div class="field-desc">默认 60 天（2个月）</div>
          </a-form-item>

          <a-form-item>
            <a-button type="primary" :loading="saveLoading" @click="handleSave">
              保存配置
            </a-button>
          </a-form-item>
          
          <a-form-item>
            <template #label>
              <span>复诊到期前提前提醒</span>
              <a-tooltip title="可配置多个提醒天数，每个天数在复诊到期前各提醒一次，天数不可重复">
                <question-circle-outlined style="margin-left: 6px; color: #999" />
              </a-tooltip>
            </template>
            <div class="reminder-list">
              <div v-if="reminderList.length === 0" class="reminder-empty">暂无提醒配置，请添加</div>
              <div
                v-for="item in reminderList"
                :key="item.id"
                class="reminder-item"
              >
                <span>复诊到期前 <strong>{{ item.days }}</strong> 天提醒一次</span>
                <a-popconfirm
                  title="确定删除该提醒配置？"
                  @confirm="handleDeleteReminder(item.days)"
                >
                  <a-button type="link" size="small" danger :loading="deletingDays === item.days">
                    删除
                  </a-button>
                </a-popconfirm>
              </div>
            </div>
            <div class="reminder-add">
              <a-input-number
                v-model:value="newReminderDays"
                :min="1"
                :max="30"
                placeholder="天数"
                style="width: 140px"
                addon-after="天"
              />
              <a-button type="primary" :loading="addingReminder" @click="handleAddReminder">
                添加提醒
              </a-button>
            </div>
            <div class="field-desc">例如：配置 7 天、3 天、1 天将分别在到期前 7 天、3 天、1 天各提醒一次</div>
          </a-form-item>

          
        </a-form>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { QuestionCircleOutlined } from '@ant-design/icons-vue'
import { getConfigs, updateConfig, getReminders, createReminder, deleteReminder } from '@/api/config'

const loading = ref(false)
const saveLoading = ref(false)
const addingReminder = ref(false)
const deletingDays = ref(null)
const reminderList = ref([])
const newReminderDays = ref(undefined)

const form = reactive({
  follow_up_interval_days: 60
})

/**
 * 加载复诊提前提醒天数列表（按天数降序）
 */
async function fetchReminders() {
  const res = await getReminders()
  const list = res.data || []
  reminderList.value = [...list].sort((a, b) => b.days - a.days)
}

async function fetchConfigs() {
  loading.value = true
  try {
    const res = await getConfigs()
    const list = res.data || []
    list.forEach((item) => {
      if (item.config_key === 'follow_up_interval_days') {
        form.follow_up_interval_days = Number(item.config_value)
      }
    })
    await fetchReminders()
  } finally {
    loading.value = false
  }
}

/**
 * 添加提醒天数
 */
async function handleAddReminder() {
  const days = newReminderDays.value
  if (!days || days < 1) {
    message.warning('请输入有效的提醒天数')
    return
  }
  if (reminderList.value.some((item) => item.days === days)) {
    message.warning('该提醒天数已存在，不可重复')
    return
  }
  addingReminder.value = true
  try {
    await createReminder({ days })
    message.success('提醒配置添加成功')
    newReminderDays.value = undefined
    await fetchReminders()
  } finally {
    addingReminder.value = false
  }
}

/**
 * 删除提醒天数
 * @param {number} days
 */
async function handleDeleteReminder(days) {
  deletingDays.value = days
  try {
    await deleteReminder(days)
    message.success('提醒配置已删除')
    await fetchReminders()
  } finally {
    deletingDays.value = null
  }
}

async function handleSave() {
  if (!form.follow_up_interval_days || form.follow_up_interval_days < 1) {
    message.warning('复诊间隔天数必须大于0')
    return
  }
  saveLoading.value = true
  try {
    await updateConfig('follow_up_interval_days', form.follow_up_interval_days)
    message.success('配置保存成功')
  } finally {
    saveLoading.value = false
  }
}

onMounted(fetchConfigs)
</script>

<style lang="less" scoped>
.config-card {
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}
.field-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
}
.reminder-list {
  margin-bottom: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}
.reminder-empty {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
.reminder-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  &:last-child {
    border-bottom: none;
  }
}
.reminder-add {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
