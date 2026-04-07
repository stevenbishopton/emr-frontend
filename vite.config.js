import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      './runtimeConfig': './runtimeConfig.browser',
    },
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      port: 5174
    },
    proxy: {
      // Proxy API requests to backend during development
      '/emr': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true, // Support WebSocket
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    }
  },
})