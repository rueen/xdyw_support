import request from '@/utils/request'

/**
 * 获取业务员列表
 * @param {object} params - { name, phone, provinceCode, cityCode, districtCode, parentId, status, page, pageSize }
 */
export function getSalespersonList(params) {
  return request.get('/salespersons', { params })
}

/**
 * 获取业务员详情
 * @param {number} id
 */
export function getSalespersonDetail(id) {
  return request.get(`/salespersons/${id}`)
}

/**
 * 获取我的下级列表
 * @param {object} params - { page, pageSize }
 */
export function getSubordinates(params) {
  return request.get('/salespersons/subordinates', { params })
}

/**
 * 新增业务员
 * @param {object} data - { name, phone, password, province, city, district, parentId }
 */
export function createSalesperson(data) {
  return request.post('/salespersons', data)
}

/**
 * 修改业务员
 * @param {number} id
 * @param {object} data
 */
export function updateSalesperson(id, data) {
  return request.put(`/salespersons/${id}`, data)
}

/**
 * 删除业务员
 * @param {number} id
 */
export function deleteSalesperson(id) {
  return request.delete(`/salespersons/${id}`)
}
