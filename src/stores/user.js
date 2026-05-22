import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null')
  }),

  getters: {
    /** 是否超级管理员 */
    isSuperAdmin: (state) => state.userInfo?.role === 'super_admin',
    /** 是否医生 */
    isDoctor: (state) => state.userInfo?.userType === 'doctor',
    /** 是否业务员（含超管） */
    isSalesperson: (state) => state.userInfo?.userType === 'salesperson',
    /** 是否已登录 */
    isLoggedIn: (state) => !!state.token
  },

  actions: {
    /**
     * 保存登录信息
     * @param {string} token
     * @param {object} userInfo
     */
    setUser(token, userInfo) {
      this.token = token
      this.userInfo = userInfo
      localStorage.setItem('token', token)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },

    /** 退出登录，清除所有状态 */
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})
