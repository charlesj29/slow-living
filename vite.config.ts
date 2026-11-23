import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { personJsonLd, portfolioHtml } from './src/games/island/core/content/portfolioHtml.ts';

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

/**
 * Where the site lives, set by the deploy workflow: BASE_PATH is the address
 * prefix (e.g. "/slow-living/" on GitHub Pages), SITE_URL the full address.
 * Both default to the site root, so local dev and builds are unchanged.
 */
const BASE_PATH = process.env.BASE_PATH ?? '/';
const SITE_URL = process.env.SITE_URL ?? '';

/**
 * Link previews (WhatsApp, LinkedIn, ...) need full addresses: with SITE_URL
 * set, the preview image becomes absolute and the page gets its og:url.
 */
function absolutePreviewUrls(): Plugin {
  return {
    name: 'absolute-preview-urls',
    transformIndexHtml: (html) => {
      if (!SITE_URL) return html;
      const site = SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`;
      return (
        html
          // Vite may already have put the base in front of the path: match either form.
          .replace(/content="[^"]*og-image\.jpg"/, `content="${site}og-image.jpg"`)
          .replace(
            '<meta property="og:type" content="website" />',
            `<meta property="og:type" content="website" />\n    <meta property="og:url" content="${site}" />`,
          )
      );
    },
  };
}

export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), portfolioInHtml(), absolutePreviewUrls()],
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
    // Some tests run ESLint or simulate minutes of game time; give them room on slow machines (CI).
    testTimeout: 30000,
  },
});
