import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Add resolve alias for easier imports
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Configure environment variables
  define: {
    'process.env': {}
  },
})
