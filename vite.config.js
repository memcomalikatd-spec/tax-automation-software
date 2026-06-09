import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: false,
    proxy: {
      '/api/email': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/email/, '/api/email')
      },
      '/api/extract-pdf': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/extract-pdf/, '/api/extract-pdf')
      },
      '/api/notices': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/notices/, '/api/notices')
      }
    },
    hmr: {
      overlay: true,
    },
    watch: {
      usePolling: true,
    },
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '/uploads': '/uploads'
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist']
  },
  build: {
    commonjsOptions: {
      include: [/pdfjs-dist/, /node_modules/]
    },
    rollupOptions: {
      external: ['electron']
    }
  }
})