<template>
  <div class="page-container">
    <a-spin :spinning="loading">
      <!-- 返回按钮 -->
      <div class="back-bar">
        <a-button @click="$router.back()">
          <arrow-left-outlined /> 返回列表
        </a-button>
      </div>

      <template v-if="detail">
        <a-row :gutter="16">
          <!-- 移动端：操作区优先展示 -->
          <a-col v-if="isMobile" :xs="24">
            <a-card title="操作" class="info-card">
              <a-space direction="vertical" style="width: 100%" :size="10">
                <a-button block @click="router.push(`/salespersons/${detail.id}/edit`)">
                  <edit-outlined /> 编辑业务员
                </a-button>
                <a-popconfirm
                  v-if="detail.role !== 'super_admin'"
                  title="确定删除该业务员？若有下级则无法删除。"
                  @confirm="doDelete"
                >
                  <a-button danger block>
                    <delete-outlined /> 删除业务员
                  </a-button>
                </a-popconfirm>
              </a-space>
            </a-card>
          </a-col>

          <!-- 基础信息 -->
          <a-col :xs="24" :md="16">
            <a-card title="业务员信息" class="info-card">
              <template #extra>
                <a-tag :color="detail.status === 'normal' ? 'green' : 'red'" style="font-size: 14px; padding: 2px 10px">
                  {{ detail.status === 'normal' ? '正常' : '停用' }}
                </a-tag>
              </template>
              <a-descriptions :column="{ xs: 1, sm: 2 }" bordered size="small">
                <a-descriptions-item label="姓名">{{ detail.name }}</a-descriptions-item>
                <a-descriptions-item label="手机号">{{ detail.phone }}</a-descriptions-item>
                <a-descriptions-item label="角色" :span="2">
                  <a-tag :color="detail.role === 'super_admin' ? 'gold' : 'default'">
                    {{ detail.role === 'super_admin' ? '超级管理员' : '业务员' }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="所在地区" :span="2">
                  {{ [detail.province_name, detail.city_name, detail.district_name].filter(Boolean).join(' / ') || '-' }}
                </a-descriptions-item>
                <a-descriptions-item label="所属机构" :span="2">
                  {{ detail.institution_name || '-' }}
                </a-descriptions-item>
                <a-descriptions-item label="上级业务员">
                  {{ detail.parent_name || '-' }}
                </a-descriptions-item>
                <a-descriptions-item label="状态">
                  <a-tag :color="detail.status === 'normal' ? 'green' : 'red'">
                    {{ detail.status === 'normal' ? '正常' : '停用' }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="创建时间">{{ detail.created_at }}</a-descriptions-item>
                <a-descriptions-item label="更新时间">{{ detail.updated_at }}</a-descriptions-item>
              </a-descriptions>
            </a-card>
          </a-col>

          <!-- PC端：右侧操作区 -->
          <a-col :xs="0" :md="8">
            <a-card title="操作" class="info-card">
              <a-space direction="vertical" style="width: 100%" :size="10">
                <a-button block @click="router.push(`/salespersons/${detail.id}/edit`)">
                  <edit-outlined /> 编辑业务员
                </a-button>
                <a-popconfirm
                  v-if="detail.role !== 'super_admin'"
                  title="确定删除该业务员？若有下级则无法删除。"
                  @confirm="doDelete"
                >
                  <a-button danger block>
                    <delete-outlined /> 删除业务员
                  </a-button>
                </a-popconfirm>
              </a-space>
            </a-card>
          </a-col>
        </a-row>
      </template>
    </a-spin>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue'
import {
  getSalespersonDetail,
  deleteSalesperson
} from '@/api/salesperson'
import { useIsMobile } from '@/composables/useIsMobile'

const route = useRoute()
const router = useRouter()
const { isMobile } = useIsMobile()

const loading = ref(false)
const detail = ref(null)

async function fetchDetail() {
  loading.value = true
  try {
    const res = await getSalespersonDetail(route.params.id)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

// ===================== 删除 =====================
async function doDelete() {
  await deleteSalesperson(detail.value.id)
  message.success('删除成功')
  router.back()
}

onMounted(() => {
  fetchDetail()
})
</script>

<style lang="less" scoped>
.page-container {
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: #f0f2f5;
}
.back-bar {
  margin-bottom: 16px;
}
.info-card {
  margin-bottom: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

@media (max-width: 767px) {
  .page-container {
    padding: 12px;
  }
  .back-bar {
    margin-bottom: 12px;
  }
  .info-card {
    margin-bottom: 12px;
    border-radius: 6px;

    :deep(.ant-card-head) {
      min-height: 44px;
      padding: 0 12px;
      font-size: 14px;
    }
    :deep(.ant-card-body) {
      padding: 12px;
    }
  }

  :deep(.ant-descriptions-item-label),
  :deep(.ant-descriptions-item-content) {
    padding: 8px 10px !important;
    font-size: 13px;
  }
}
</style>
