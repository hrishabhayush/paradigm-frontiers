import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: { https: false },
  optimizeDeps: { exclude: ['porto'] },
  build: {
    rollupOptions: {
      external: ['porto'],
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})


