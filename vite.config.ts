// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  loadEnv(mode, process.cwd(), '') // ถ้าจะใช้ค่า env ฝั่ง client ทีหลัง ค่อยเปลี่ยนเป็น VITE_*
  return {
    // ต้องตรงชื่อ repo
    base: '/Barsan-Global-Logistics-HR-Report/',
    server: { host: '0.0.0.0', port: 3000 },
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './') } },
    build: { outDir: 'dist' },
  }
})