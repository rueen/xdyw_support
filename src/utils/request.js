import axios from 'axios'
import { message } from 'ant-design-vue'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000
})

/**
 * 从接口响应中提取可读错误信息（优先展示字段级错误）
 * @param {object} [data] - 接口响应体
 * @param {string} [fallback='操作失败'] - 默认提示
 * @returns {string}
 */
function getErrorMessage(data, fallback = '操作失败') {
  const fieldErrors = (data?.errors || [])
    .map((item) => item?.message)
    .filter(Boolean)
  if (fieldErrors.length) {
    return fieldErrors.join('；')
  }
  return data?.message || fallback
}

/** 请求拦截：注入 Authorization token */
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/** 响应拦截：统一错误处理 */
request.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data.code === 200 || data.code === 201) {
      return data
    }
    const errMsg = getErrorMessage(data)
    message.error(errMsg)
    return Promise.reject(new Error(errMsg))
  },
  (error) => {
    const data = error.response?.data
    if (error.response?.status === 401) {
      // 已在登录页，直接显示错误信息，不做页面跳转
      if (window.location.pathname === '/login') {
        message.error(getErrorMessage(data, '账号或密码错误'))
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        message.error('登录已过期，请重新登录')
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      message.error('您没有权限执行此操作')
    } else if (error.response?.status === 409) {
      message.error(getErrorMessage(data, '数据冲突，请检查输入'))
    } else if (data) {
      message.error(getErrorMessage(data, '网络请求失败，请稍后重试'))
    } else {
      message.error('网络请求失败，请稍后重试')
    }
    return Promise.reject(error)
  }
)

export default request
