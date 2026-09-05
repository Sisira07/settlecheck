import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, npm run dev serves the app on :5173 and proxies API calls to your
// Spring Boot app on :8080 — so fetch('/reconcile/run') works in both dev
// and prod without changing a line of code. In prod, `npm run build` outputs
// static files you copy into the Spring Boot app itself (see README), so
// there's no proxy needed there — same origin, same port.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/reconcile': 'http://localhost:8080',
      '/data': 'http://localhost:8080',
      '/audit': 'http://localhost:8080',
      '/matches': 'http://localhost:8080',
    }
  }
})
