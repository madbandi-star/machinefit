import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs';
import path from 'path';

function spaGitHubPagesFallback(): Plugin {
  return {
    name: 'spa-github-pages-fallback',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexHtml = path.join(distDir, 'index.html');
      const notFoundHtml = path.join(distDir, '404.html');
      if (fs.existsSync(indexHtml)) {
        fs.copyFileSync(indexHtml, notFoundHtml);
      }
    },
  };
}

export default defineConfig({
  base: '/machinefit/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
          if (id.includes('axios')) return 'vendor-axios';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react';
          if (id.includes('html5-qrcode')) return 'vendor-qr';
          if (id.includes('lucide-react')) return 'vendor-icons';
        },
      },
    },
  },
  plugins: [
    react(),
    spaGitHubPagesFallback(),
    VitePWA({
      filename: 'sw-v16.js',
      selfDestroying: true,
      registerType: 'autoUpdate',
      injectRegister: null,
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: 'MachineFit',
        short_name: 'MachineFit',
        description: 'Global fitness machine fitting platform',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/machinefit/',
        scope: '/machinefit/',
        id: '/machinefit/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
