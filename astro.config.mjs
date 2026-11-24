// @ts-check
import { createReadStream, cpSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

const ARTICLES_DIR = path.resolve('src/content/articles');

/** Files under src/content/articles that are article sources, not assets to publish. */
const isSource = (/** @type {string} */ file) => /\.(adoc|md|html|tex|aux|log|dvi)$/.test(file);

const MIME = /** @type {Record<string, string>} */ ({
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
});

/** Reload the browser whenever an AsciiDoc article changes (they're read at request time, not imported). */
function asciidocLiveReload() {
  return {
    name: 'asciidoc-live-reload',
    /** @param {import('vite').ViteDevServer} server */
    configureServer(server) {
      const reload = (/** @type {string} */ file) => {
        // Also reload when a figure is (re)built next to an article.
        if (file.endsWith('.adoc') || (file.startsWith(ARTICLES_DIR) && !isSource(file))) {
          server.ws.send({ type: 'full-reload' });
        }
      };
      server.watcher.on('change', reload);
      server.watcher.on('add', reload);
    },
  };
}

/**
 * Publish images that live next to their article (e.g. src/content/articles/AiAYN/figures/x.svg)
 * at /articles/AiAYN/figures/x.svg — served directly in dev, copied into dist/ on build.
 * @returns {import('astro').AstroIntegration}
 */
function articleAssets() {
  return {
    name: 'article-assets',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const url = decodeURIComponent((req.url ?? '').split('?')[0]);
          if (!url.startsWith('/articles/')) return next();
          const file = path.join(ARTICLES_DIR, url.slice('/articles/'.length));
          // Stay inside the articles folder, and never serve article sources.
          if (!file.startsWith(ARTICLES_DIR + path.sep) || isSource(file)) return next();
          if (!existsSync(file) || !statSync(file).isFile()) return next();
          res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
          createReadStream(file).pipe(res);
        });
      },
      'astro:build:done': ({ dir }) => {
        cpSync(ARTICLES_DIR, path.join(fileURLToPath(dir), 'articles'), {
          recursive: true,
          filter: (src) => !isSource(src),
        });
      },
    },
  };
}

export default defineConfig({
  site: 'https://seang123.github.io',
  output: 'static',
  integrations: [articleAssets()],
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-latte'
    }
  },
  vite: {
    plugins: [asciidocLiveReload()],
  },
});
