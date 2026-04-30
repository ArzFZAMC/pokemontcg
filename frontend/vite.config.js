import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'PocketDex TCG',
        short_name: 'PocketDex',
        description: 'Premium Pokémon TCG Collection Tracker',
        theme_color: '#0d0d1a',
        background_color: '#0d0d1a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.pokemontcg\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pokemon-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 86400
              }
            }
          },
          {
            urlPattern: /^https:\/\/images\.pokemontcg\.io\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokemon-images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 604800
              }
            }
          }
        ]
      }
    })
  ],

  server: {
    host: '0.0.0.0',
    allowedHosts: true,

    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});