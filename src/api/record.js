import request from '@/utils/request'

/**
 * 获取病例列表
 * @param {object} params - { patientName, patientPhone, patientIdCard, doctorId, status, page, pageSize }
 */
export function getRecordList(params) {
  return request.get('/records', { params })
}

/**
 * 获取病例详情
 * @param {number} id
 */
export function getRecordDetail(id) {
  return request.get(`/records/${id}`)
}

/**
 * 新增病例
 * @param {object} data - { patientName, patientPhone, patientIdCard, doctorId, description, photos }
 */
export function createRecord(data) {
  return request.post('/records', data)
}

/**
 * 修改病例基础信息
 * @param {number} id
 * @param {object} data
 */
export function updateRecord(id, data) {
  return request.put(`/records/${id}`, data)
}

/**
 * 删除病例（超级管理员）
 * @param {number} id
 */
export function deleteRecord(id) {
  return request.delete(`/records/${id}`)
}

/**
 * 医生判读病例
 * @param {number} id
 * @param {object} data - { operation, notes }
 */
export function reviewRecord(id, data) {
  return request.post(`/records/${id}/review`, data)
}

/**
 * 业务员操作「已就诊」
 * @param {number} id
 */
export function visitRecord(id) {
  return request.post(`/records/${id}/visited`)
}

/**
 * 业务员操作「已复诊」
 * @param {number} id
 * @param {object} data - { followUpTime, notes }
 */
export function followUpRecord(id, data) {
  return request.post(`/records/${id}/follow-up`, data)
}

/**
 * 标记病例「已完诊」
 * @param {number} id
 */
export function completeRecord(id) {
  return request.post(`/records/${id}/complete`)
}

/**
 * 业务员补充资料
 * @param {number} id
 * @param {object} data - { description, photos }
 */
export function supplementRecord(id, data) {
  return request.post(`/records/${id}/supplement`, data)
}

/**
 * 业务员操作「已付费」
 * @param {number} id
 * @param {object} data - { amount, vouchers?, notes? }
 */
export function payRecord(id, data) {
  return request.post(`/records/${id}/pay`, data)
}

/**
 * 业务员操作「已退费」
 * @param {number} id
 * @param {object} data - { amount?, vouchers?, notes? }
 */
export function refundRecord(id, data) {
  return request.post(`/records/${id}/refund`, data)
}
