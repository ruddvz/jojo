import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages project site is served from /<repo>/.
// Override with BASE_PATH env if the repo name changes.
const base = process.env.BASE_PATH ?? '/jojo/';

export default defineConfig({
  base,
  build: {
    target: 'es2020',
    sourcemap: false,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png', 'fonts/*.ttf'],
      manifest: {
        id: base,
        name: 'Jobs — Command Centre',
        short_name: 'Jobs',
        description: 'Personal job-search command centre.',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#F2F2F7',
        theme_color: '#FFFFFF',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ttf,woff2}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
