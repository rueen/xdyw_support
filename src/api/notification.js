import request from '@/utils/request'

/**
 * 获取通知列表
 * @param {object} params - { page, pageSize, isRead }
 */
export function getNotifications(params) {
  return request.get('/notifications', { params })
}

/**
 * 标记单条通知已读
 * @param {number} id
 */
export function markNotificationRead(id) {
  return request.put(`/notifications/${id}/read`)
}

/** 全部标记已读 */
export function markAllNotificationsRead() {
  return request.put('/notifications/read-all')
}
