import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { personJsonLd, portfolioHtml } from './src/games/island/core/content/portfolioHtml';

/**
 * Writes the portfolio into index.html (placeholders <!-- portfolio:html -->
 * and <!-- portfolio:jsonld -->), so search engines and visitors without
 * JavaScript can read it. The content stays in one file (portfolio.ts).
 */
function portfolioInHtml(): Plugin {
  return {
    name: 'portfolio-in-html',
    transformIndexHtml: (html) =>
      html
        .replace('<!-- portfolio:html -->', portfolioHtml())
        .replace(
          '<!-- portfolio:jsonld -->',
          `<script type="application/ld+json">${personJsonLd()}</script>`,
        ),
  };
}

export default defineConfig({
  plugins: [react(), portfolioInHtml()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // Three.js alone exceeds Vite's 500 kB default. The game chunk is lazy-loaded
    // per route, so a larger limit is acceptable; see docs/DECISIONS.md.
    chunkSizeWarningLimit: 1200,
  },
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
  },
});
