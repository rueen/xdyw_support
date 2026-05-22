<template>
  <div class="page-container">
    <a-card title="系统配置" class="config-card">
      <a-spin :spinning="loading">
        <a-form layout="vertical" style="max-width: 480px">
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
            <template #label>
              <span>提前提醒天数</span>
              <a-tooltip title="复诊到期前提前几天给业务员发送通知提醒">
                <question-circle-outlined style="margin-left: 6px; color: #999" />
              </a-tooltip>
            </template>
            <a-input-number
              v-model:value="form.follow_up_reminder_days"
              :min="1"
              :max="30"
              style="width: 180px"
              addon-after="天"
            />
            <div class="field-desc">复诊到期前提前该天数发送提醒通知</div>
          </a-form-item>

          <a-form-item>
            <a-button type="primary" :loading="saveLoading" @click="handleSave">
              保存配置
            </a-button>
          </a-form-item>
        </a-form>
      </a-spin>
    </a-card>

    <!-- 配置说明 -->
    <a-card title="配置说明" class="config-card">
      <a-descriptions :column="1" bordered size="small">
        <a-descriptions-item label="follow_up_interval_days">
          复诊间隔天数。业务员标记「已就诊」后，系统根据此配置计算下次复诊到期时间（就诊时间 + 间隔天数）。
        </a-descriptions-item>
        <a-descriptions-item label="follow_up_reminder_days">
          提前提醒天数。当复诊到期时间距今不超过该天数时，系统自动向对应业务员推送复诊提醒通知。
        </a-descriptions-item>
      </a-descriptions>
    </a-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { QuestionCircleOutlined } from '@ant-design/icons-vue'
import { getConfigs, updateConfig } from '@/api/config'

const loading = ref(false)
const saveLoading = ref(false)
const form = reactive({
  follow_up_interval_days: 60,
  follow_up_reminder_days: 7
})

async function fetchConfigs() {
  loading.value = true
  try {
    const res = await getConfigs()
    const list = res.data || []
    list.forEach((item) => {
      if (item.config_key === 'follow_up_interval_days') {
        form.follow_up_interval_days = Number(item.config_value)
      }
      if (item.config_key === 'follow_up_reminder_days') {
        form.follow_up_reminder_days = Number(item.config_value)
      }
    })
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!form.follow_up_interval_days || form.follow_up_interval_days < 1) {
    message.warning('复诊间隔天数必须大于0')
    return
  }
  if (!form.follow_up_reminder_days || form.follow_up_reminder_days < 1) {
    message.warning('提前提醒天数必须大于0')
    return
  }
  saveLoading.value = true
  try {
    await Promise.all([
      updateConfig('follow_up_interval_days', form.follow_up_interval_days),
      updateConfig('follow_up_reminder_days', form.follow_up_reminder_days)
    ])
    message.success('配置保存成功')
  } finally {
    saveLoading.value = false
  }
}

onMounted(fetchConfigs)
</script>

<style lang="less" scoped>
.page-container {
  padding: 24px;
}
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
</style>
