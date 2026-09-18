import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Cogitador Consulta',
        short_name: 'Cogitador',
        description:
          'Consulta de reglas, catálogo de facciones, constructor de listas y calculadora de daño para Warhammer 40.000 (11ª edición).',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#080808',
        background_color: '#080808',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The ~15MB game-data JSON under public/data isn't precached on install (that'd make
        // the first visit's install step huge) — it's cached lazily at runtime instead, via
        // the runtimeCaching rule below, the first time each file is actually fetched.
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Faction/catalog/mission JSON: served from cache first for instant, offline-capable
            // reads, refreshed in the background so the next load picks up any data edits.
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/data/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'game-data',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Auth/roster/chat calls are user-scoped and dynamic — never serve them from cache.
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    // Backend lives in server/ (`npm run dev` there) and isn't started by Vite — proxy
    // /api so the frontend can call it with same-origin relative paths in dev too.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})
