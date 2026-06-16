import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.syntern.in', 'localhost', '127.0.0.1'],
    hmr: {
      protocol: 'wss',
      host: 'dev.syntern.in',
      clientPort: 443,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        ws: true,
      },
      '/ws': {
        target: 'ws://localhost:5001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});