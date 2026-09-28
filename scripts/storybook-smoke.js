/* global window, document, requestAnimationFrame */
// Opens every story of a static Storybook build in Chromium, in both themes with motion off,
// and fails on page errors, console errors, an errored or empty render, or axe violations.
// Usage: node scripts/storybook-smoke.js <dir> [--expect-fail <id>[,<id>...]]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';
import { storyIds, verdict } from './lib/smoke.js';

const [dir, flag, list] = process.argv.slice(2);
if (!dir || (flag !== undefined && flag !== '--expect-fail')) {
  console.error('usage: node scripts/storybook-smoke.js <dir> [--expect-fail <id>[,<id>...]]');
  process.exit(2);
}
const expectFail = flag ? (list ?? '').split(',').filter(Boolean) : [];
const root = resolve(dir);
// The same rules as test/support/axe.ts.
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const server = createServer(async (request, response) => {
  const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname));
  const file = join(root, path.endsWith('/') ? `${path}index.html` : path);
  if (!file.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((listening) => server.listen(0, '127.0.0.1', listening));
const base = `http://127.0.0.1:${server.address().port}`;

const index = JSON.parse(await readFile(join(root, 'index.json'), 'utf8'));
const browser = await chromium.launch();
const runs = [];
for (const id of storyIds(index)) {
  for (const theme of ['light', 'dark']) {
    const error = await check(id, theme);
    runs.push({ id, theme, error });
    console.log(error === null ? `ok   ${id} [${theme}]` : `FAIL ${id} [${theme}]: ${error}`);
  }
}
await browser.close();
server.close();

const { ok, problems } = verdict(runs, expectFail);
for (const problem of problems) console.error(problem);
if (ok && expectFail.length > 0) console.log(`ok   the smoke test failed the expected stories: ${expectFail.join(', ')}`);
process.exit(ok ? 0 : 1);

/**
 * The first reason the story fails in `theme`, or null when it passes.
 * @param {string} id
 * @param {string} theme
 * @returns {Promise<string | null>}
 */
async function check(id, theme) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`page error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console error: ${message.text()}`);
  });
  try {
    await page.goto(`${base}/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:${theme};motion:off`);
    const settled = await page
      .waitForFunction(
        () => {
          if (document.body.classList.contains('sb-show-errordisplay')) return true;
          const story = document.querySelector('#storybook-root .mb-story');
          return story !== null && (story.children.length > 0 || story.textContent.trim() !== '');
        },
        null,
        { timeout: 5000 },
      )
      .then(
        () => true,
        () => false,
      );
    if (!settled) return errors[0] ?? 'nothing rendered within 5 s';
    if (await page.evaluate(() => document.body.classList.contains('sb-show-errordisplay'))) {
      return errors[0] ?? 'Storybook error display';
    }
    // Let Lit elements finish their first update before auditing.
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async (values) => {
      const results = await window.axe.run('#storybook-root', { runOnly: { type: 'tag', values } });
      return results.violations.map((violation) => `${violation.id} (${violation.nodes.length})`);
    }, tags);
    if (errors.length > 0) return errors[0];
    return violations.length > 0 ? `axe: ${violations.join(', ')}` : null;
  } finally {
    await page.close();
  }
}
