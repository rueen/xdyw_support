import axios from 'axios'
import { message } from 'ant-design-vue'

const request = axios.create({
  baseURL: '/api/v1',
  timeout: 15000
})

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
    message.error(data.message || '操作失败')
    return Promise.reject(new Error(data.message || '操作失败'))
  },
  (error) => {
    if (error.response?.status === 401) {
      // 已在登录页，直接显示错误信息，不做页面跳转
      if (window.location.pathname === '/login') {
        message.error(error.response.data?.message || '账号或密码错误')
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        message.error('登录已过期，请重新登录')
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      message.error('您没有权限执行此操作')
    } else if (error.response?.status === 409) {
      message.error(error.response.data?.message || '数据冲突，请检查输入')
    } else if (error.response?.data?.message) {
      message.error(error.response.data.message)
    } else {
      message.error('网络请求失败，请稍后重试')
    }
    return Promise.reject(error)
  }
)

export default request
