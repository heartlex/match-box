// Bundles each public subpath from dist, gzips it, and compares it with size-budget.json.
// `--write` records current sizes plus 10% headroom as the new budget.
import { build } from 'esbuild';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const entries = {
  'match-box/core': 'dist/core/index.js',
  'match-box/core/state': 'dist/core/state/index.js',
  'match-box/core/dom': 'dist/core/dom/index.js',
  'match-box/core/a11y': 'dist/core/a11y/index.js',
  'match-box/core/testing': 'dist/core/testing/index.js',
  'match-box/lit': 'dist/lit/index.js',
  'match-box/components': 'dist/components/index.js',
  'match-box/components/define/all.js': 'dist/components/define/all.js',
  'match-box/tokens.css': 'dist/tokens/tokens.css',
};

const budgetFile = new URL('../size-budget.json', import.meta.url);
const budgets = existsSync(budgetFile) ? JSON.parse(readFileSync(budgetFile, 'utf8')) : {};
const measured = {};
let failed = false;

for (const [name, file] of Object.entries(entries)) {
  const result = await build({
    entryPoints: [file],
    bundle: true,
    minify: true,
    format: 'esm',
    write: false,
    outdir: 'size-check',
    external: ['lit', 'chai'],
    logLevel: 'silent',
  });
  const bytes = gzipSync(result.outputFiles[0].contents).length;
  measured[name] = bytes;
  const budget = budgets[name];
  const ok = budget !== undefined && bytes <= budget;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${bytes} B gzip (budget ${budget ?? 'none'})`);
}

if (process.argv.includes('--write')) {
  const next = Object.fromEntries(
    Object.entries(measured).map(([name, bytes]) => [name, Math.ceil((bytes * 1.1) / 100) * 100]),
  );
  writeFileSync(budgetFile, `${JSON.stringify(next, null, 2)}\n`);
  console.log('Wrote size-budget.json');
} else if (failed) {
  process.exit(1);
}
