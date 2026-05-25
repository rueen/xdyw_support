import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 响应式移动端检测（< 768px 视为移动端）
 * @returns {{ isMobile: import('vue').Ref<boolean> }}
 */
export function useIsMobile() {
  const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth < 768 : false)

  function onResize() {
    isMobile.value = window.innerWidth < 768
  }

  onMounted(() => window.addEventListener('resize', onResize))
  onUnmounted(() => window.removeEventListener('resize', onResize))

  return { isMobile }
}
