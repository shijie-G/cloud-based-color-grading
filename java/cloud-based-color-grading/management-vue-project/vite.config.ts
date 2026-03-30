import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  // 多页面应用配置
  build: {
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'login.html'),
        station: resolve(__dirname, 'station.html')
      }
    }
  },
  server: {
    port: 3000,
    // 移除代理配置，直接使用CORS
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8080',
    //     changeOrigin: true
    //   },
    //   '/auth': {
    //     target: 'http://localhost:8080',
    //     changeOrigin: true
    //   },
    //   '/users': {
    //     target: 'http://localhost:8080',
    //     changeOrigin: true
    //   }
    // }
  },
  test: {
    globals: true,
    environment: 'happy-dom'
  }
})
