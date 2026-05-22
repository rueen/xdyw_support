<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <!-- <div class="login-logo">SBN</div> -->
        <h1 class="login-title">赛百诺病例管理系统</h1>
        <p class="login-subtitle">医疗数据管理平台</p>
      </div>

      <a-form
        ref="formRef"
        :model="form"
        :rules="rules"
        layout="vertical"
        class="login-form"
        @finish="handleLogin"
      >
        <a-form-item name="phone">
          <a-input
            v-model:value="form.phone"
            size="large"
            placeholder="请输入手机号"
            :maxlength="11"
          >
            <template #prefix>
              <mobile-outlined class="input-icon" />
            </template>
          </a-input>
        </a-form-item>

        <a-form-item name="password">
          <a-input-password
            v-model:value="form.password"
            size="large"
            placeholder="请输入密码"
          >
            <template #prefix>
              <lock-outlined class="input-icon" />
            </template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <div class="remember-row">
            <a-checkbox v-model:checked="rememberMe">记住密码</a-checkbox>
          </div>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            block
            :loading="loading"
            class="login-btn"
          >
            登 录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { MobileOutlined, LockOutlined } from '@ant-design/icons-vue'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const loading = ref(false)
const rememberMe = ref(false)
const form = ref({ phone: '', password: '' })

const REMEMBER_KEY = 'remember_credential'

/** 页面挂载时读取已保存的账号密码 */
onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null')
    if (saved?.phone) {
      form.value.phone = saved.phone
      form.value.password = saved.password
      rememberMe.value = true
    }
  } catch {
    // 忽略解析异常
  }
})

const rules = {
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码至少6位' }
  ]
}

async function handleLogin() {
  loading.value = true
  try {
    const res = await login({ phone: form.value.phone, password: form.value.password })
    const { token, userInfo } = res.data

    // 根据勾选状态保存或清除记住的账号密码
    if (rememberMe.value) {
      localStorage.setItem(REMEMBER_KEY, JSON.stringify({
        phone: form.value.phone,
        password: form.value.password
      }))
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }

    userStore.setUser(token, userInfo)
    message.success('登录成功')
    if (userInfo.userType === 'doctor') {
      router.push('/records')
    } else {
      router.push('/dashboard')
    }
  } catch {
    // 错误已由请求拦截器统一提示，此处仅阻止异常冒泡
  } finally {
    loading.value = false
  }
}
</script>

<style lang="less" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1677ff 0%, #0958d9 50%, #003eb3 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    top: -100px;
    right: -100px;
  }
  &::after {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    bottom: -50px;
    left: -80px;
  }
}

.login-box {
  width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-logo {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #1677ff, #0958d9);
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 16px;
  box-shadow: 0 8px 24px rgba(22, 119, 255, 0.35);
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 6px;
}

.login-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.login-form {
  .input-icon {
    color: #bbb;
  }
}

.remember-row {
  display: flex;
  align-items: center;
  margin-top: -8px;
}

.login-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  background: linear-gradient(135deg, #1677ff, #0958d9);
  border: none;
  &:hover {
    background: linear-gradient(135deg, #4096ff, #1677ff) !important;
  }
}
</style>
