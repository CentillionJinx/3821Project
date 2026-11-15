import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-192x192.svg', 'pwa-512x512.svg'],
      manifest: {
        name: 'Colouring Conundrum | Binary XOR-Square NP-Completeness Workbench',
        short_name: 'XOR-Square',
        description:
          'Binary XOR-Square Colouring Conundrum: formal 2-colour {0, 1} grid puzzle, O(NM) verifier, and Planar 3-SAT NP-completeness reduction (COMP3821 Group 5).',
        theme_color: '#090708',
        background_color: '#090708',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/pwa-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
})
