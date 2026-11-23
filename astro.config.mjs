// @ts-check
import { defineConfig } from 'astro/config';

/** Reload the browser whenever an AsciiDoc article changes (they're read at request time, not imported). */
function asciidocLiveReload() {
  return {
    name: 'asciidoc-live-reload',
    /** @param {import('vite').ViteDevServer} server */
    configureServer(server) {
      const reload = (/** @type {string} */ file) => {
        if (file.endsWith('.adoc')) server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('change', reload);
      server.watcher.on('add', reload);
    },
  };
}

export default defineConfig({
  site: 'https://seang123.github.io',
  output: 'static',
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-latte'
    }
  },
  vite: {
    plugins: [asciidocLiveReload()],
  },
});
