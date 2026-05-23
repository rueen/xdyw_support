import request from '@/utils/request'

/**
 * 获取机构列表
 * @param {object} params - { name, status, page, pageSize }
 */
export function getInstitutionList(params) {
  return request.get('/institutions', { params })
}

/**
 * 新增机构
 * @param {object} data - { name, status }
 */
export function createInstitution(data) {
  return request.post('/institutions', data)
}

/**
 * 修改机构
 * @param {number} id
 * @param {object} data - { name, status }
 */
export function updateInstitution(id, data) {
  return request.put(`/institutions/${id}`, data)
}

/**
 * 删除机构
 * @param {number} id
 */
export function deleteInstitution(id) {
  return request.delete(`/institutions/${id}`)
}
