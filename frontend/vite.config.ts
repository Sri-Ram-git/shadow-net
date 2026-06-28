import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In production (Vercel), VITE_API_URL must be set to the Railway backend URL.
// In development, the proxy below forwards /api requests to the backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        ws: true,
      },
      '/uploads': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
