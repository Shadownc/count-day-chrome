import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import copy from 'rollup-plugin-copy'

export default defineConfig({
  plugins: [
    vue(),
    copy({
      targets: [
        { src: 'manifest.json', dest: 'dist' },
        { src: 'icons/*.png', dest: 'dist/icons' }
      ],
      hook: 'writeBundle'
    })
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup/popup.html')
      }
    },
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: '/popup/popup.html',
    host: true
  }
})