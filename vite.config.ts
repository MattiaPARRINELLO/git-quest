import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Root deployments (local, Vercel, custom domain) keep "/". GitHub Pages serves
// the app from https://<user>.github.io/<repo>/, so the deploy workflow sets
// VITE_BASE_PATH=/git-quest/ — every generated URL then carries the prefix.
const base = process.env['VITE_BASE_PATH'] ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'GitQuest — Apprendre Git visuellement',
        short_name: 'GitQuest',
        description:
          'Bac à sable Git interactif : commits, branches, merge et worktrees visualisés en direct.',
        lang: 'fr',
        theme_color: '#0a0b0f',
        background_color: '#0a0b0f',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
});
