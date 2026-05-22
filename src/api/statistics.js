import request from '@/utils/request'

/**
 * 获取统计数据
 * @param {object} params - { rangeType, startDate, endDate }
 */
export function getStatistics(params) {
  return request.get('/statistics', { params })
}
