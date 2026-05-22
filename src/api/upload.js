import request from '@/utils/request'

/**
 * 上传图片
 * @param {FormData} formData - 字段名为 images
 */
export function uploadImages(formData) {
  return request.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
