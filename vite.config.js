import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:3000'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: {
            'primary-color': '#1677ff'
          },
          javascriptEnabled: true
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'ant-design-vue': ['ant-design-vue', '@ant-design/icons-vue'],
            'vue-vendor': ['vue', 'vue-router', 'pinia']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
          configure: (proxy) => {
            // 转发前移除 Origin 头，避免触发服务端 CORS 拒绝
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin')
              proxyReq.removeHeader('referer')
            })
          }
        }
      }
    }
  }
})
