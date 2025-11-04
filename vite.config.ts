// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// polyfill __dirname ใน ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // ★ สำคัญสำหรับ GitHub Pages: ต้องตรงกับชื่อ repo
    base: '/Barsan-Global-Logistics-HR-Report/',

    server: {
      host: '0.0.0.0',
      port: 3000,
    },

    plugins: [react()],

    // ถ้าจำเป็นต้องอ้างถึงค่า env แบบอินไลน์ (จะถูก bundle ลง client)
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
        // หรือจะใช้แบบ ESM ล้วนก็ได้:
        // '@': fileURLToPath(new URL('./', import.meta.url)),
      },
    },

    build: { outDir: 'dist' },
  }
})
