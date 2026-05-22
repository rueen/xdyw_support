<template>
  <div class="image-upload-wrapper">
    <a-upload
      v-model:file-list="fileList"
      list-type="picture-card"
      :custom-request="handleUpload"
      :before-upload="beforeUpload"
      :max-count="maxCount"
      multiple
      accept="image/jpeg,image/png,image/webp,image/gif"
      @remove="handleRemove"
    >
      <div v-if="fileList.length < maxCount" class="upload-trigger">
        <plus-outlined />
        <div class="upload-text">上传图片</div>
        <div class="upload-hint">最多 {{ maxCount }} 张</div>
      </div>
    </a-upload>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { uploadImages } from '@/api/upload'

const props = defineProps({
  /** v-model 绑定：URL 字符串数组 */
  modelValue: {
    type: Array,
    default: () => []
  },
  /** 最大张数 */
  maxCount: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['update:modelValue'])

/** 将外部 URL 数组转换为 fileList 格式 */
function urlsToFileList(urls) {
  return (urls || []).map((url, idx) => ({
    uid: `existing-${idx}`,
    name: `image-${idx + 1}`,
    status: 'done',
    url
  }))
}

const fileList = ref(urlsToFileList(props.modelValue))

// 监听外部 modelValue 变化（编辑时回填）
watch(
  () => props.modelValue,
  (val) => {
    if (val && val.length > 0 && fileList.value.length === 0) {
      fileList.value = urlsToFileList(val)
    }
  },
  { immediate: true }
)

/** 上传前校验 */
function beforeUpload(file) {
  const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
  if (!isImage) {
    message.error('仅支持 JPG、PNG、WebP、GIF 格式')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    message.error('单张图片不超过 10MB')
    return false
  }
  return true
}

/**
 * Canvas 压缩图片
 * - 最长边超过 MAX_SIZE 时等比缩小
 * - GIF 跳过压缩（canvas 会丢失动画）
 * @param {File} file
 * @returns {Promise<File>}
 */
function compressImage(file) {
  const MAX_SIZE = 1920
  const QUALITY = 0.8

  if (file.type === 'image/gif') return Promise.resolve(file)

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let { width, height } = img
      if (width > MAX_SIZE || height > MAX_SIZE) {
        if (width >= height) {
          height = Math.round((height * MAX_SIZE) / width)
          width = MAX_SIZE
        } else {
          width = Math.round((width * MAX_SIZE) / height)
          height = MAX_SIZE
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // WebP 保持 WebP，其余统一输出 JPEG
      const outputType = file.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
      canvas.toBlob(
        (blob) => {
          const compressed = new File([blob], file.name, { type: outputType, lastModified: Date.now() })
          resolve(compressed)
        },
        outputType,
        QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

/** 自定义上传：先压缩再调 /upload 接口 */
async function handleUpload({ file, onSuccess, onError }) {
  try {
    const compressed = await compressImage(file)
    const formData = new FormData()
    formData.append('images', compressed)
    const res = await uploadImages(formData)
    const url = res.data?.urls?.[0] || res.data?.files?.[0]?.url
    onSuccess({ url }, file)
    emitUrls()
  } catch (err) {
    onError(err)
    message.error('图片上传失败')
  }
}

/** 删除图片 */
function handleRemove() {
  // 下一个 tick 等待 fileList 更新后再 emit
  setTimeout(emitUrls, 0)
}

/** 输出当前所有已上传的 URL */
function emitUrls() {
  const urls = fileList.value
    .filter((f) => f.status === 'done')
    .map((f) => f.response?.url || f.url)
    .filter(Boolean)
  emit('update:modelValue', urls)
}

// 监听 fileList 变化，同步 emit
watch(
  fileList,
  () => {
    emitUrls()
  },
  { deep: true }
)
</script>

<style lang="less" scoped>
.image-upload-wrapper {
  :deep(.ant-upload-select) {
    width: 100px;
    height: 100px;
  }
  :deep(.ant-upload-list-picture-card .ant-upload-list-item) {
    width: 100px;
    height: 100px;
  }
}
.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}
.upload-text {
  margin-top: 4px;
  font-size: 13px;
}
.upload-hint {
  font-size: 11px;
  color: #bbb;
}
</style>
