import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost/showcase-app/backend/public',
      '/auth': 'http://localhost/showcase-app/backend/public',
      '/sanctum': 'http://localhost/showcase-app/backend/public',
      '/storage': 'http://localhost/showcase-app/backend/public',
      '/drive': 'http://localhost/showcase-app/backend/public',
    },
  },
})
