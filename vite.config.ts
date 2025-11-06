// vite.config.ts
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// รองรับ __dirname ใน ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // ✨ สำคัญสำหรับ GitHub Pages — ต้องตรงกับชื่อ repo
    base: '/Barsan-Global-Logistics-HR-Report/',

    server: { host: '0.0.0.0', port: 3000 },
    plugins: [react()],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
        // หรือใช้แบบ ESM ล้วน:
        // '@': fileURLToPath(new URL('./', import.meta.url)),
      },
    },

    build: { outDir: 'dist' },
  }
})
