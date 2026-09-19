import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: true,
    hmr: {
      clientPort: 443
    },
    // Add this proxy block to connect the frontend to the backend
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // <-- Change 5000 to your backend port if different!
        changeOrigin: true,
        secure: false
      }
    }
  }
})
