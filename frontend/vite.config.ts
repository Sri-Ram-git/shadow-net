import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The proxy forwards /api requests to the backend during development.
// In production (Vercel), the Python serverless function at api/index.py handles /api.
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
