// Compile every .tex file under src/content/articles into an .svg next to it.
//
//   npm run figures            rebuild figures whose .tex is newer than their .svg
//   npm run figures -- --force rebuild everything
//
// Requires `latex` and `dvisvgm` (TeX Live). LaTeX's .aux/.log/.dvi go to a temp dir,
// so the article folders only ever contain the .tex source and the .svg output.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ARTICLES_DIR = path.resolve('src/content/articles');
const force = process.argv.includes('--force');

const texFiles = readdirSync(ARTICLES_DIR, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.tex'))
  .map((f) => path.join(ARTICLES_DIR, f));

const mtime = (f) => {
  try { return statSync(f).mtimeMs; } catch { return 0; }
};

let built = 0;
let failed = 0;
for (const tex of texFiles) {
  const svg = tex.replace(/\.tex$/, '.svg');
  const rel = path.relative(process.cwd(), tex);
  if (!force && mtime(svg) >= mtime(tex)) continue;

  const work = mkdtempSync(path.join(tmpdir(), 'figure-'));
  const name = path.basename(tex, '.tex');
  try {
    // Run from the .tex file's folder so \input / \includegraphics resolve relative to it.
    execFileSync(
      'latex',
      ['-interaction=nonstopmode', '-halt-on-error', `-output-directory=${work}`, path.basename(tex)],
      { cwd: path.dirname(tex), stdio: 'pipe' },
    );
    // --no-fonts turns glyphs into paths so the SVG renders identically everywhere.
    execFileSync('dvisvgm', ['--no-fonts', '--exact-bbox', path.join(work, `${name}.dvi`), '-o', svg], {
      stdio: 'pipe',
    });
    console.log(`✓ ${rel}`);
    built++;
  } catch (err) {
    failed++;
    const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    // Show only LaTeX's error lines ("! ...") plus a little context, not the whole log.
    const lines = out.split('\n');
    const i = lines.findIndex((l) => l.startsWith('!'));
    console.error(`✗ ${rel}\n${(i >= 0 ? lines.slice(i, i + 6) : lines.slice(-15)).join('\n')}\n`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

console.log(`${built} built, ${failed} failed, ${texFiles.length - built - failed} up to date`);
process.exitCode = failed ? 1 : 0;
