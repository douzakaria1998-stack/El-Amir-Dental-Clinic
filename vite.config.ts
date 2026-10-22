import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const dbUrl = env.VITE_DATABASE_URL || env.DATABASE_URL || ''
  const branch = env.VITE_NEON_BRANCH || env.NEON_BRANCH || ''

  return {
    base: './',
    plugins: [react()],
    define: {
      'import.meta.env.VITE_DATABASE_URL': JSON.stringify(dbUrl),
      'import.meta.env.VITE_NEON_BRANCH': JSON.stringify(branch),
    },
  }
})
