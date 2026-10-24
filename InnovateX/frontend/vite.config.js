import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('maplibre-gl')) {
            return 'maplibre'
          }
          if (id.includes('@deck.gl/core') || id.includes('@deck.gl/mapbox')) {
            return 'deckgl-core'
          }
          if (id.includes('@deck.gl/layers') || id.includes('@deck.gl/aggregation-layers')) {
            return 'deckgl-layers'
          }
        },
      },
    },
  },
})
