<template>
  <a-layout class="main-layout">
    <!-- 侧边栏 -->
    <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      :trigger="null"
      width="220"
      class="sider"
      theme="dark"
    >
      <div class="logo">
        <span v-if="!collapsed" class="logo-text">鑫达医委管理系统</span>
        <span v-else class="logo-short">SBN</span>
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="onMenuClick"
      >
        <a-menu-item key="/dashboard">
          <template #icon><dashboard-outlined /></template>
          工作台
        </a-menu-item>
        <a-menu-item key="/records">
          <template #icon><file-text-outlined /></template>
          病例管理
        </a-menu-item>
        <a-menu-item v-if="!isDoctor" key="/salespersons">
          <template #icon><team-outlined /></template>
          业务员管理
        </a-menu-item>
        <a-menu-item v-if="isSuperAdmin" key="/doctors">
          <template #icon><medicine-box-outlined /></template>
          医生管理
        </a-menu-item>
        <a-menu-item v-if="isSuperAdmin" key="/config">
          <template #icon><setting-outlined /></template>
          系统配置
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout>
      <!-- 顶部 Header -->
      <a-layout-header class="header" :style="{ left: collapsed ? '80px' : '220px' }">
        <div class="header-left">
          <a-button
            type="text"
            class="collapse-btn"
            @click="collapsed = !collapsed"
          >
            <menu-unfold-outlined v-if="collapsed" />
            <menu-fold-outlined v-else />
          </a-button>
          <span class="page-title">{{ currentPageTitle }}</span>
        </div>
        <div class="header-right">
          <!-- 通知铃铛（医生不显示） -->
          <notification-bell v-if="!isDoctor" />

          <!-- 用户信息下拉 -->
          <a-dropdown placement="bottomRight">
            <a-button type="text" class="user-btn">
              <user-outlined />
              <span class="user-name">{{ userInfo?.name }}</span>
              <down-outlined />
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item key="password" @click="showPwdModal = true">
                  <lock-outlined /> 修改密码
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="handleLogout">
                  <logout-outlined /> 退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <!-- 内容区 -->
      <a-layout-content class="content" :style="{ marginLeft: collapsed ? '80px' : '220px' }">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>

  <!-- 修改密码 Modal -->
  <a-modal
    v-model:open="showPwdModal"
    title="修改密码"
    :confirm-loading="pwdLoading"
    @ok="handleChangePwd"
    @cancel="resetPwdForm"
  >
    <a-form
      ref="pwdFormRef"
      :model="pwdForm"
      :rules="pwdRules"
      layout="vertical"
      style="margin-top: 16px"
    >
      <a-form-item label="旧密码" name="oldPassword">
        <a-input-password v-model:value="pwdForm.oldPassword" placeholder="请输入旧密码" />
      </a-form-item>
      <a-form-item label="新密码" name="newPassword">
        <a-input-password v-model:value="pwdForm.newPassword" placeholder="6-50位，必须包含字母和数字" />
      </a-form-item>
      <a-form-item label="确认新密码" name="confirmPassword">
        <a-input-password v-model:value="pwdForm.confirmPassword" placeholder="请再次输入新密码" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  DownOutlined,
  LockOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'
import { useUserStore } from '@/stores/user'
import { changePassword } from '@/api/auth'
import NotificationBell from '@/components/NotificationBell.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const collapsed = ref(false)
const isSuperAdmin = computed(() => userStore.isSuperAdmin)
const isDoctor = computed(() => userStore.isDoctor)
const userInfo = computed(() => userStore.userInfo)

/** 当前高亮菜单 */
const selectedKeys = computed(() => {
  const path = route.path
  if (path.startsWith('/records')) return ['/records']
  if (path.startsWith('/salespersons')) return ['/salespersons']
  if (path.startsWith('/doctors')) return ['/doctors']
  if (path === '/config') return ['/config']
  return ['/dashboard']
})

/** 当前页面标题 */
const pageTitleMap = {
  '/dashboard': '工作台',
  '/records': '病例管理',
  '/salespersons': '业务员管理',
  '/doctors': '医生管理',
  '/config': '系统配置'
}
const currentPageTitle = computed(() => {
  if (route.path.startsWith('/records/') && route.params.id) return '病例详情'
  return pageTitleMap[route.path] || ''
})

function onMenuClick({ key }) {
  router.push(key)
}

/** 退出登录 */
function handleLogout() {
  userStore.logout()
  message.success('已退出登录')
  router.push('/login')
}

// 修改密码
const showPwdModal = ref(false)
const pwdLoading = ref(false)
const pwdFormRef = ref()
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })

const pwdRules = {
  oldPassword: [{ required: true, message: '请输入旧密码' }],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { min: 6, max: 50, message: '密码长度为6-50位' },
    {
      validator: (_, value) => {
        if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(value)) {
          return Promise.reject('密码必须包含字母和数字')
        }
        return Promise.resolve()
      }
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码' },
    {
      validator: (_, value) => {
        if (value !== pwdForm.value.newPassword) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      }
    }
  ]
}

async function handleChangePwd() {
  await pwdFormRef.value.validate()
  pwdLoading.value = true
  try {
    await changePassword({
      oldPassword: pwdForm.value.oldPassword,
      newPassword: pwdForm.value.newPassword
    })
    message.success('密码修改成功，请重新登录')
    showPwdModal.value = false
    userStore.logout()
    router.push('/login')
  } finally {
    pwdLoading.value = false
  }
}

function resetPwdForm() {
  pwdFormRef.value?.resetFields()
  pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
}
</script>

<style lang="less" scoped>
.main-layout {
  min-height: 100vh;
}

.sider {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  overflow-y: auto;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  white-space: nowrap;

  .logo-text {
    font-size: 15px;
  }
  .logo-short {
    font-size: 18px;
  }
}

.header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 99;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 0;
  background: #1677ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: left 0.2s;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .collapse-btn {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.85);
    width: 64px;
    height: 64px;
    border-radius: 0;
    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1) !important;
    }
  }

  .page-title {
    color: #fff;
    font-size: 16px;
    font-weight: 500;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-btn {
    color: rgba(255, 255, 255, 0.85);
    display: flex;
    align-items: center;
    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.1) !important;
    }
    .user-name {
      margin: 0 6px;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.content {
  margin-top: 64px;
  transition: margin-left 0.2s;
  min-height: calc(100vh - 64px);
  background: #f0f2f5;
}
</style>
