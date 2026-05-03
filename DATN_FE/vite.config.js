import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  css: {
    devSourcemap: true
  },
  resolve: {
    alias: {
      path: 'path-browserify'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['lodash', 'moment', 'moment-timezone', 'date-fns', 'dayjs'],
          ui: ['antd', 'react-hot-toast', 'react-toastify', 'framer-motion', 'react-icons'],
          chart: ['chart.js', 'react-chartjs-2', 'recharts'],
          tf: ['@tensorflow/tfjs', 'face-api.js', 'nsfwjs'],
          maps: ['leaflet', 'react-leaflet', '@goongmaps/goong-js', '@goongmaps/goong-map-react']
        }
      }
    }
  }
})
