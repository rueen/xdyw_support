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
