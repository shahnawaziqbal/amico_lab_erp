import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true, // Allows external public tunnel domains (pinggy, localtunnel, ngrok)
    proxy: {
      '/auth': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/products': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/inventory': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/procurement': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/production': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/quality': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/sales': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/finance': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/hrm': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/maintenance': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/compliance': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/crm': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/rnd': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ai-analytics': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/field-officers': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});