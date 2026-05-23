import request from '@/utils/request'

/** 获取所有配置项 */
export function getConfigs() {
  return request.get('/configs')
}

/**
 * 修改配置项
 * @param {string} key - 配置键名
 * @param {string|number} value - 配置值
 */
export function updateConfig(key, value) {
  return request.put(`/configs/${key}`, { value: String(value) })
}

/**
 * 获取复诊提前提醒天数列表
 * @returns {Promise<{ data: Array<{ id: number, days: number, created_at: string }> }>}
 */
export function getReminders() {
  return request.get('/configs/reminders')
}

/**
 * 新增复诊提前提醒天数
 * @param {object} data - { days: number }
 */
export function createReminder(data) {
  return request.post('/configs/reminders', data)
}

/**
 * 删除复诊提前提醒天数
 * @param {number} days - 提醒天数
 */
export function deleteReminder(days) {
  return request.delete(`/configs/reminders/${days}`)
}
