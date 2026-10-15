import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // 开发环境走代理，避免前端硬编码后端地址，便于换机部署
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
