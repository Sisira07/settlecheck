import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/data': 'http://localhost:8080',
      '/reconcile': 'http://localhost:8080',
      '/audit': 'http://localhost:8080',
    }
  }
})
