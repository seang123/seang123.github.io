import { readdirSync } from 'node:fs';
import path from 'node:path';
import { loadFile } from '@asciidoctor/core';
import { bundledLanguages, codeToHtml } from 'shiki';

// Same theme as the markdown shikiConfig in astro.config.mjs.
const SHIKI_THEME = 'catppuccin-latte';

const SOURCE_BLOCK = /<pre class="highlight"><code class="language-([\w+#-]+)" data-lang="[^"]*">([\s\S]*?)<\/code><\/pre>/g;

const unescapeHtml = (s: string) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

/** Replace Asciidoctor's plain [source,lang] blocks with Shiki-highlighted ones. */
async function highlight(html: string): Promise<string> {
  const blocks = [...html.matchAll(SOURCE_BLOCK)];
  const rendered = await Promise.all(
    blocks.map(async ([whole, lang, code]) => {
      // Leave unknown languages and blocks with inline markup (e.g. callouts) untouched.
      if (!(lang in bundledLanguages) || code.includes('<')) return whole;
      return codeToHtml(unescapeHtml(code), { lang, theme: SHIKI_THEME });
    }),
  );
  let i = 0;
  return html.replace(SOURCE_BLOCK, () => rendered[i++]);
}

export const ARTICLES_DIR = path.resolve('src/content/articles');

/** All .adoc files under src/content/articles, as slugs like "AiAYN/EncoderDecoderTransformer". */
export function listArticles(): string[] {
  return readdirSync(ARTICLES_DIR, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.adoc'))
    .map((f) => f.replace(/\.adoc$/, '').split(path.sep).join('/'));
}

/** Parse + convert an article. Called at request time in dev, so every reload sees the latest file. */
export async function renderArticle(slug: string) {
  const file = path.join(ARTICLES_DIR, `${slug}.adoc`);
  const doc = await loadFile(file, { safe: 'safe' });
  return {
    title: doc.getDocumentTitle() as string,
    author: doc.getAttribute('author') as string | undefined,
    date: doc.getAttribute('revdate') as string | undefined,
    description: doc.getAttribute('description') as string | undefined,
    hasStem: doc.hasAttribute('stem'),
    html: await highlight((await doc.convert()) as string),
  };
}
