import request from '@/utils/request'

/**
 * 获取医生列表
 * @param {object} params - { name, phone, status, page, pageSize }
 */
export function getDoctorList(params) {
  return request.get('/doctors', { params })
}

/** 获取可用医生列表（新建病例时选择） */
export function getActiveDoctors() {
  return request.get('/doctors/active')
}

/**
 * 新增医生
 * @param {object} data - { name, phone, password }
 */
export function createDoctor(data) {
  return request.post('/doctors', data)
}

/**
 * 修改医生
 * @param {number} id
 * @param {object} data - { name, phone, password, status }
 */
export function updateDoctor(id, data) {
  return request.put(`/doctors/${id}`, data)
}

/**
 * 删除医生
 * @param {number} id
 */
export function deleteDoctor(id) {
  return request.delete(`/doctors/${id}`)
}
