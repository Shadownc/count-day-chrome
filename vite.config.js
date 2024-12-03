import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import copy from 'rollup-plugin-copy'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
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
        popup: resolve(__dirname, 'popup/popup.html'),
        options: resolve(__dirname, 'options/options.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    open: '/popup/popup.html',
    host: true
  }
})