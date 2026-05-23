import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '工作台' }
      },
      {
        path: 'records',
        name: 'Records',
        component: () => import('@/views/record/index.vue'),
        meta: { title: '病例管理' }
      },
      {
        path: 'records/:id',
        name: 'RecordDetail',
        component: () => import('@/views/record/detail.vue'),
        meta: { title: '病例详情' }
      },
      {
        path: 'salespersons',
        name: 'Salespersons',
        component: () => import('@/views/salesperson/index.vue'),
        meta: { title: '我的业务员', notDoctor: true }
      },
      {
        path: 'institutions',
        name: 'Institutions',
        component: () => import('@/views/institution/index.vue'),
        meta: { title: '机构管理', superAdmin: true }
      },
      {
        path: 'doctors',
        name: 'Doctors',
        component: () => import('@/views/doctor/index.vue'),
        meta: { title: '医生管理', superAdmin: true }
      },
      {
        path: 'config',
        name: 'Config',
        component: () => import('@/views/config/index.vue'),
        meta: { title: '系统配置', superAdmin: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.public) {
    if (userStore.isLoggedIn && to.path === '/login') {
      return next('/')
    }
    return next()
  }

  if (!userStore.isLoggedIn) {
    return next('/login')
  }

  // 超管专属页面，非超管跳病例管理
  if (to.meta.superAdmin && !userStore.isSuperAdmin) {
    return next('/records')
  }

  // 医生不可访问的页面，跳病例管理
  if (to.meta.notDoctor && userStore.isDoctor) {
    return next('/records')
  }

  next()
})

export default router
