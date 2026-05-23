<template>
  <a-badge :count="unreadCount" :offset="[-4, 4]">
    <a-dropdown :trigger="['click']" placement="bottomRight" @open-change="onDropdownChange">
      <a-button type="text" class="bell-btn" @click.stop>
        <template #icon>
          <BellOutlined class="bell-icon" />
        </template>
      </a-button>
      <template #overlay>
        <div class="notification-panel">
          <div class="panel-header">
            <span class="panel-title">通知消息</span>
            <a-button
              v-if="unreadCount > 0"
              type="link"
              size="small"
              @click="readAll"
            >
              全部已读
            </a-button>
          </div>
          <a-spin :spinning="loading">
            <div v-if="list.length === 0" class="empty-tip">暂无通知</div>
            <div
              v-for="item in list"
              :key="item.id"
              class="notification-item"
              :class="{ unread: !item.is_read }"
              @click="handleClick(item)"
            >
              <div class="item-content">{{ item.content }}</div>
              <div class="item-time">{{ item.created_at }}</div>
            </div>
          </a-spin>
        </div>
      </template>
    </a-dropdown>
  </a-badge>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { BellOutlined } from '@ant-design/icons-vue'
import { useRouter } from 'vue-router'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/api/notification'
import { message } from 'ant-design-vue'

const router = useRouter()

const unreadCount = ref(0)
const list = ref([])
const loading = ref(false)

/** 页面加载时请求一次未读数 */
async function fetchUnreadCount() {
  if (!localStorage.getItem('token')) return
  try {
    const res = await getNotifications({ page: 1, pageSize: 1 })
    unreadCount.value = res.data?.unreadCount || 0
  } catch {
    // 静默失败
  }
}

/** 下拉打开时加载通知列表 */
async function onDropdownChange(open) {
  if (!open || !localStorage.getItem('token')) return
  loading.value = true
  try {
    const res = await getNotifications({ page: 1, pageSize: 10 })
    list.value = res.data?.list || []
    unreadCount.value = res.data?.unreadCount || 0
  } catch {
    // 静默失败
  } finally {
    loading.value = false
  }
}

/** 点击单条通知 */
async function handleClick(item) {
  if (!item.is_read) {
    await markNotificationRead(item.id)
    item.is_read = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  router.push(`/records/${item.record_id}`)
}

/** 全部标记已读 */
async function readAll() {
  await markAllNotificationsRead()
  message.success('已全部标记为已读')
  list.value.forEach((item) => (item.is_read = 1))
  unreadCount.value = 0
}

onMounted(() => {
  fetchUnreadCount()
})
</script>

<style lang="less" scoped>
.bell-btn {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1) !important;
  }
}
.bell-icon {
  font-size: 18px;
}
.notification-panel {
  width: 360px;
  max-height: 480px;
  overflow-y: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  .panel-title {
    font-weight: 600;
    font-size: 15px;
  }
}
.empty-tip {
  padding: 32px;
  text-align: center;
  color: #999;
}
.notification-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #f5f5f5;
  }
  &.unread {
    background: #fffbf0;
    &::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #fa8c16;
      margin-right: 6px;
      vertical-align: middle;
    }
  }
  .item-content {
    font-size: 13px;
    color: #333;
    line-height: 1.5;
    margin-bottom: 4px;
  }
  .item-time {
    font-size: 11px;
    color: #999;
  }
}
</style>
