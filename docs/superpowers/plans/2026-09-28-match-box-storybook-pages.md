# match-box Storybook and GitHub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Storybook as an interactive playground for the components, headless patterns, and motion helpers, smoke-test every story in CI, and publish the Eleventy guide, TypeDoc, and Storybook on GitHub Pages under `/match-box/`.

**Architecture:** Storybook 10 (`@storybook/web-components-vite`) lives in `.storybook/` and `stories/`, imports the source, and reads controls from `dist/custom-elements.json`. A Node script opens every story of the static build in Playwright Chromium and runs axe; fixture stories that must fail prove it works. Eleventy gains a path prefix from `ELEVENTY_PATH_PREFIX` and the HTML base plugin, checked by a script that scans the generated HTML. A Pages workflow builds all three on `v*` tags.

**Tech Stack:** As 0.4 (TypeScript 6.0, Lit 3, Vitest 5, web-test-runner, Playwright, axe-core, Eleventy 3, TypeDoc), plus Storybook 10 and Vite (dev dependencies).

**Spec:** `docs/superpowers/specs/2026-09-28-match-box-storybook-pages-design.md`

## Global Constraints

- Every commit is authored and committed by `heartlex <gianluca.strada@studio.unibo.it>` (the repo's local git config); no `Co-Authored-By` trailer.
- Work happens on `feature/storybook-pages`.
- New packages are dev dependencies only: `storybook`, `@storybook/web-components-vite`, `@storybook/addon-docs`, `@storybook/addon-a11y` (major 10), `vite`. The published package does not change: no edit to `src/`, `package.json`'s `version`, `exports`, or `CHANGELOG.md`.
- Site layout on Pages: `/` Eleventy guide, `/api/` TypeDoc, `/storybook/` Storybook, under `https://heartlex.github.io/match-box/`.
- `ELEVENTY_PATH_PREFIX` defaults to `/`; local `npm run docs` and `eleventy --serve` behave as today.
- Smoke test: every story, themes `light` and `dark`, motion `off`, Chromium; fails on `pageerror`, `console` errors, Storybook's error display, an empty story within 5 s, or an axe violation with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`.
- Pages deploys on `v*` tags and `workflow_dispatch` only.
- Generated directories are ignored by git and ESLint: `storybook-static/`, `storybook-smoke-fixture/`, `_site-prefix-check/`.
- Every existing gate stays green: `npm run typecheck`, `npm run lint`, `npm run test:unit`, `npm run test:browser`, `npm run size`, `npm run docs`.
- Code style: match the surrounding files; comments only where the code does not say why.

## Review Focus

1. **Absolute URLs inside inline module scripts.** The pattern pages `import … from '/demos/demos.js'`; the HTML base plugin rewrites attributes, not script text, so they would 404 under `/match-box/`. The check scans inline module scripts. Test: Task 1 ("flags an absolute import in an inline module script").
2. **URLs shown in code samples.** A code block containing `href="/docs"` or `from '/demos/demos.js'` is escaped text, not a link; flagging it would make the check cry wolf. Test: Task 1 ("ignores URLs shown in code samples").
3. **A smoke run that finds nothing to check.** A broken glob or an empty build would pass vacuously. Test: Task 2 ("fails when there are no stories").
4. **Each failure mode, not just a throw.** A story that only logs `console.error`, one with an axe violation, and one that renders nothing must each fail. Test: Task 2 fixtures `LogsError`, `AxeViolation`, `Empty`, run by `storybook:smoke:self-test`.
5. **Fixture stories leaking into the published Storybook.** They must exist only in the fixture build. Test: Task 2 ("the published build has no smoke fixtures") and Task 5's local Pages build check.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `scripts/lib/site-prefix.js` | Create | `findUnprefixed(html, prefix)` |
| `scripts/check-site-prefix.js` | Create | CLI: scan a built site for URLs outside the prefix |
| `scripts/lib/smoke.js` | Create | `storyIds(index)`, `verdict(runs, expectFail)` |
| `scripts/storybook-smoke.js` | Create | CLI: serve a Storybook build and check every story |
| `eleventy.config.js`, `site/_includes/layout.njk`, `site/patterns/*.md`, `site/index.md` | Modify | Path prefix, import map, Storybook links |
| `.storybook/main.ts`, `.storybook/preview.ts`, `.storybook/env.d.ts` | Create | Storybook config, toolbar, decorator, manifest |
| `stories/Introduction.mdx` | Create | Landing page |
| `stories/__smoke__/fixtures.stories.ts` | Create | Stories that must fail the smoke test |
| `stories/components/*.stories.ts` | Create | Five component story files |
| `stories/patterns/*.stories.ts` | Create | Three pattern story files |
| `stories/motion/shared.ts`, `stories/motion/*.stories.ts` | Create | Motion story helpers and four story files |
| `test/unit/scripts/site-prefix.test.ts`, `smoke.test.ts` | Create | Unit tests for the script libraries |
| `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.js`, `.gitignore` | Modify | Scripts, dev dependencies, includes, ignores |
| `.github/workflows/ci.yml` | Modify | Prefix check and smoke steps |
| `.github/workflows/pages.yml` | Create | Build and deploy to Pages |
| `README.md` | Modify | Site link and Storybook scripts |

---

### Task 1: Eleventy path prefix and its check

**Files:**
- Create: `scripts/lib/site-prefix.js`, `scripts/check-site-prefix.js`, `test/unit/scripts/site-prefix.test.ts`
- Modify: `eleventy.config.js`, `site/_includes/layout.njk`, `site/patterns/listbox.md`, `site/patterns/disclosure.md`, `site/patterns/dialog.md`, `package.json` (scripts), `tsconfig.json`, `eslint.config.js`, `.gitignore`

**Interfaces:**
- Produces: `findUnprefixed(html: string, prefix: string): string[]` in `scripts/lib/site-prefix.js`; the npm script `docs:prefix-check`; the Eleventy nav link to `/storybook/`.

- [ ] **Step 1: Let TypeScript import the JavaScript script libraries**

In `tsconfig.json`, add to `compilerOptions` after `"noEmit": true,`:

```json
    "allowJs": true,
```

(`checkJs` stays off: the JS files are not type-checked, but their JSDoc types reach the TS tests.)

- [ ] **Step 2: Write the failing unit test**

`test/unit/scripts/site-prefix.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { findUnprefixed } from '../../../scripts/lib/site-prefix.js';

const prefix = '/match-box/';

describe('findUnprefixed', () => {
  it('flags root-relative href and src outside the prefix', () => {
    const html =
      '<a href="/theming/">T</a><script type="module" src="/pkg/all.js"></script><link href="/match-box/pkg/tokens.css">';
    expect(findUnprefixed(html, prefix)).toEqual(['/theming/', '/pkg/all.js']);
  });

  it('ignores external, protocol-relative, relative, anchor, and mailto URLs', () => {
    const html =
      '<a href="https://x.dev/">x</a><script src="//cdn.dev/a.js"></script><a href="../api/">r</a><a href="#top">t</a><a href="mailto:a@b.c">m</a>';
    expect(findUnprefixed(html, prefix)).toEqual([]);
  });

  it('flags import map entries outside the prefix', () => {
    const html =
      '<script type="importmap">{"imports":{"lit":"/vendor/lit/index.js","match-box/core":"/match-box/pkg/core/index.js"}}</script>';
    expect(findUnprefixed(html, prefix)).toEqual(['/vendor/lit/index.js']);
  });

  it('flags an absolute import in an inline module script', () => {
    const html = `<script type="module">
  import { mountListbox } from '/demos/demos.js';
  import 'match-box/motion';
  await import('/lazy.js');
</script>`;
    expect(findUnprefixed(html, prefix)).toEqual(['/demos/demos.js', '/lazy.js']);
  });

  it('ignores URLs shown in code samples', () => {
    const html =
      "<pre><code>&lt;mb-button href=&quot;/docs&quot;&gt;\nimport { mountListbox } from '/demos/demos.js';</code></pre>";
    expect(findUnprefixed(html, prefix)).toEqual([]);
  });

  it('accepts every root-relative URL when the prefix is /', () => {
    expect(findUnprefixed('<a href="/theming/">T</a>', '/')).toEqual([]);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run test/unit/scripts/site-prefix.test.ts`
Expected: FAIL, cannot find `scripts/lib/site-prefix.js`.

- [ ] **Step 4: Implement the library**

`scripts/lib/site-prefix.js`:

```js
// Finds root-relative URLs in generated HTML that do not start with the site's path prefix.

const attribute = /\s(?:href|src)="([^"]*)"/g;
const importMap = /<script type="importmap">([\s\S]*?)<\/script>/g;
const moduleScript = /<script type="module">([\s\S]*?)<\/script>/g;
const moduleSpecifier = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g;

/**
 * Whether `url` is root-relative (`/x`, not `//host/x`) and outside `prefix`.
 * @param {string} url
 * @param {string} prefix
 */
function outside(url, prefix) {
  return url.startsWith('/') && !url.startsWith('//') && !url.startsWith(prefix);
}

/**
 * The root-relative URLs in `html` that do not start with `prefix`: in `href`
 * and `src` attributes, import maps, and imports inside inline module scripts.
 * Escaped text, such as code samples, is not a URL and is ignored.
 * @param {string} html
 * @param {string} prefix
 * @returns {string[]}
 */
export function findUnprefixed(html, prefix) {
  const urls = [...html.matchAll(attribute)].map((match) => match[1]);
  for (const [, json] of html.matchAll(importMap)) {
    const { imports = {}, scopes = {} } = JSON.parse(json);
    urls.push(...Object.values(imports), ...Object.values(scopes).flatMap((scope) => Object.values(scope)));
  }
  for (const [, code] of html.matchAll(moduleScript)) {
    urls.push(...[...code.matchAll(moduleSpecifier)].map((match) => match[1]));
  }
  return urls.filter((url) => outside(url, prefix));
}
```

- [ ] **Step 5: Run the unit test to verify it passes**

Run: `npx vitest run test/unit/scripts/site-prefix.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Add the CLI and the npm script**

`scripts/check-site-prefix.js`:

```js
// Fails when a generated page links outside the site's path prefix.
// Usage: node scripts/check-site-prefix.js <dir> <prefix>
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findUnprefixed } from './lib/site-prefix.js';

const [dir, prefix] = process.argv.slice(2);
if (!dir || !prefix) {
  console.error('usage: node scripts/check-site-prefix.js <dir> <prefix>');
  process.exit(2);
}

let failed = false;
for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const file = join(entry.parentPath, entry.name);
  for (const url of findUnprefixed(readFileSync(file, 'utf8'), prefix)) {
    failed = true;
    console.log(`${relative(dir, file)}: ${url}`);
  }
}
if (failed) process.exit(1);
console.log(`ok   every local URL in ${dir} starts with ${prefix}`);
```

In `package.json` `scripts`, add after `"docs"`:

```json
    "docs:prefix-check": "ELEVENTY_PATH_PREFIX=/match-box/ eleventy --output=_site-prefix-check && node scripts/check-site-prefix.js _site-prefix-check /match-box/",
```

In `.gitignore`, add `_site-prefix-check/`. In `eslint.config.js`, change the ignores line to:

```js
  { ignores: ['dist', '_site', 'size-check', '_site-prefix-check', 'storybook-static', 'storybook-smoke-fixture'] },
```

- [ ] **Step 7: Run the check to verify the site fails it today**

Run: `npm run build && npm run docs:prefix-check`
Expected: FAIL (exit 1), listing URLs such as `index.html: /pkg/tokens/tokens.css`, `index.html: /vendor/lit/index.js`, `patterns/listbox/index.html: /demos/demos.js`.

- [ ] **Step 8: Add the prefix to Eleventy**

In `eleventy.config.js`, add at the top:

```js
import { HtmlBasePlugin } from '@11ty/eleventy';
```

as the first statement inside the function:

```js
  // Pages serves the site under /match-box/; locally ELEVENTY_PATH_PREFIX is unset and it stays at /.
  eleventyConfig.addPlugin(HtmlBasePlugin);
```

and change the return to:

```js
  return {
    dir: { input: 'site', output: '_site' },
    markdownTemplateEngine: 'njk',
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX ?? '/',
  };
```

In `site/_includes/layout.njk`, replace the import map `imports` object with (the plugin does not rewrite JSON inside a script, so each URL goes through its filter):

```json
        "imports": {
          "match-box/core": "{{ '/pkg/core/index.js' | htmlBaseUrl }}",
          "match-box/components": "{{ '/pkg/components/index.js' | htmlBaseUrl }}",
          "match-box/components/": "{{ '/pkg/components/' | htmlBaseUrl }}",
          "match-box/motion": "{{ '/pkg/motion/index.js' | htmlBaseUrl }}",
          "demos/": "{{ '/demos/' | htmlBaseUrl }}",
          "lit": "{{ '/vendor/lit/index.js' | htmlBaseUrl }}",
          "lit/": "{{ '/vendor/lit/' | htmlBaseUrl }}",
          "lit-html": "{{ '/vendor/lit-html/lit-html.js' | htmlBaseUrl }}",
          "lit-html/": "{{ '/vendor/lit-html/' | htmlBaseUrl }}",
          "lit-element/": "{{ '/vendor/lit-element/' | htmlBaseUrl }}",
          "@lit/reactive-element": "{{ '/vendor/@lit/reactive-element/reactive-element.js' | htmlBaseUrl }}",
          "@lit/reactive-element/": "{{ '/vendor/@lit/reactive-element/' | htmlBaseUrl }}"
        }
```

and change the end of the `<nav>` from

```html
      <a href="/theming/">Theming</a> · <a href="/motion/">Motion</a></nav>
```

to

```html
      <a href="/theming/">Theming</a> · <a href="/motion/">Motion</a> · <a href="/storybook/">Storybook</a></nav>
```

In `site/patterns/listbox.md`, `site/patterns/disclosure.md`, and `site/patterns/dialog.md`, change the import specifier `'/demos/demos.js'` to `'demos/demos.js'` (the new import map entry resolves it under the prefix).

- [ ] **Step 9: Run the check to verify it passes, and that the local site is unchanged**

Run: `npm run docs:prefix-check`
Expected: `ok   every local URL in _site-prefix-check starts with /match-box/`.

Run: `npm run docs && node scripts/check-site-prefix.js _site /`
Expected: Eleventy writes 11 files; the check prints `ok`.

Run: `grep -o 'href="/pkg/tokens/tokens.css"' _site/index.html`
Expected: one match (the default prefix leaves URLs as before).

- [ ] **Step 10: Run the gates and commit**

Run: `npm run typecheck && npm run lint && npm run test:unit`
Expected: all pass.

```bash
git add scripts/lib/site-prefix.js scripts/check-site-prefix.js test/unit/scripts/site-prefix.test.ts eleventy.config.js site package.json tsconfig.json eslint.config.js .gitignore
git commit -m "Serve the Eleventy site under a configurable path prefix, and check it"
```

---

### Task 2: Storybook setup and the smoke test

**Files:**
- Create: `scripts/lib/smoke.js`, `scripts/storybook-smoke.js`, `test/unit/scripts/smoke.test.ts`, `.storybook/main.ts`, `.storybook/preview.ts`, `.storybook/env.d.ts`, `stories/Introduction.mdx`, `stories/__smoke__/fixtures.stories.ts`
- Modify: `package.json`, `package-lock.json`, `tsconfig.json`, `.gitignore`

**Interfaces:**
- Consumes: the ESLint ignores from Task 1.
- Produces:
  - `storyIds(index: { entries: Record<string, { id: string; type: string }> }): string[]` and `verdict(runs: { id: string; theme: string; error: string | null }[], expectFail?: string[]): { ok: boolean; problems: string[] }` in `scripts/lib/smoke.js`.
  - npm scripts `storybook`, `storybook:build`, `storybook:smoke`, `storybook:smoke:self-test`.
  - Storybook globals `theme` (`system` | `light` | `dark`) and `motion` (`on` | `off`); every story is wrapped in `div.mb-story`.
  - Story globs: `stories/*.mdx`, `stories/components/*.stories.ts`, `stories/patterns/*.stories.ts`, `stories/motion/*.stories.ts`; `stories/__smoke__/*.stories.ts` only with `STORYBOOK_SMOKE_FIXTURE=1`.

- [ ] **Step 1: Write the failing unit test**

`test/unit/scripts/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { storyIds, verdict } from '../../../scripts/lib/smoke.js';

const run = (id: string, theme: string, error: string | null = null) => ({ id, theme, error });

describe('storyIds', () => {
  it('lists stories and skips docs pages', () => {
    const index = {
      v: 5,
      entries: {
        'intro--docs': { id: 'intro--docs', type: 'docs' },
        'a--one': { id: 'a--one', type: 'story' },
        'a--docs': { id: 'a--docs', type: 'docs' },
        'b--two': { id: 'b--two', type: 'story' },
      },
    };
    expect(storyIds(index)).toEqual(['a--one', 'b--two']);
  });
});

describe('verdict', () => {
  it('passes when every run passes', () => {
    expect(verdict([run('a', 'light'), run('a', 'dark')])).toEqual({ ok: true, problems: [] });
  });

  it('fails with each failed run', () => {
    expect(verdict([run('a', 'light'), run('a', 'dark', 'axe: button-name (1)')])).toEqual({
      ok: false,
      problems: ['a [dark]: axe: button-name (1)'],
    });
  });

  it('fails when there are no stories', () => {
    expect(verdict([])).toEqual({ ok: false, problems: ['no stories found'] });
  });

  it('passes when the expected stories fail in every run and the others pass', () => {
    const runs = [run('bad', 'light', 'page error: x'), run('bad', 'dark', 'page error: x'), run('good', 'light')];
    expect(verdict(runs, ['bad']).ok).toBe(true);
  });

  it('fails when an expected story passes in any run, or is missing', () => {
    const runs = [run('bad', 'light', 'page error: x'), run('bad', 'dark')];
    expect(verdict(runs, ['bad', 'gone'])).toEqual({
      ok: false,
      problems: ['bad [dark] passed but was expected to fail', 'gone was expected to fail but is not in the build'],
    });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run test/unit/scripts/smoke.test.ts`
Expected: FAIL, cannot find `scripts/lib/smoke.js`.

- [ ] **Step 3: Implement the library**

`scripts/lib/smoke.js`:

```js
// The pure parts of the Storybook smoke test: which stories to open, and whether a run passed.

/**
 * The ids of the stories in a Storybook `index.json`, skipping docs pages.
 * @param {{ entries: Record<string, { id: string, type: string }> }} index
 * @returns {string[]}
 */
export function storyIds(index) {
  return Object.values(index.entries)
    .filter((entry) => entry.type === 'story')
    .map((entry) => entry.id);
}

/**
 * Whether a smoke run passed. Without `expectFail`, every run must pass. With it,
 * each listed story must fail in every run and every other story must pass.
 * An empty run fails: a smoke test that checked nothing proves nothing.
 * @param {{ id: string, theme: string, error: string | null }[]} runs
 * @param {string[]} [expectFail]
 * @returns {{ ok: boolean, problems: string[] }}
 */
export function verdict(runs, expectFail = []) {
  if (runs.length === 0) return { ok: false, problems: ['no stories found'] };
  const problems = [];
  for (const run of runs) {
    const expected = expectFail.includes(run.id);
    if (expected && run.error === null) problems.push(`${run.id} [${run.theme}] passed but was expected to fail`);
    if (!expected && run.error !== null) problems.push(`${run.id} [${run.theme}]: ${run.error}`);
  }
  for (const id of expectFail) {
    if (!runs.some((run) => run.id === id)) problems.push(`${id} was expected to fail but is not in the build`);
  }
  return { ok: problems.length === 0, problems };
}
```

- [ ] **Step 4: Run the unit test to verify it passes**

Run: `npx vitest run test/unit/scripts/smoke.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Install Storybook**

Run: `npm install --save-dev storybook@^10 @storybook/web-components-vite@^10 @storybook/addon-docs@^10 @storybook/addon-a11y@^10 vite`
Expected: installs without peer-dependency errors. If npm reports a missing peer (for example `react` and `react-dom` for the docs addon), install exactly the peers it names as dev dependencies and record them in the commit message.

- [ ] **Step 6: Configure Storybook**

`.storybook/main.ts`:

```ts
/// <reference types="node" />
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/web-components-vite';
import { mergeConfig } from 'vite';

// The fixtures exist only to prove the smoke test can fail (npm run storybook:smoke:self-test).
const fixtures = process.env['STORYBOOK_SMOKE_FIXTURE'] === '1' ? ['../stories/__smoke__/*.stories.ts'] : [];

const config: StorybookConfig = {
  framework: '@storybook/web-components-vite',
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  stories: [
    '../stories/*.mdx',
    '../stories/components/*.stories.ts',
    '../stories/patterns/*.stories.ts',
    '../stories/motion/*.stories.ts',
    ...fixtures,
  ],
  // site/demos/demos.js imports the core by its package name; stories use the source.
  viteFinal: (vite) =>
    mergeConfig(vite, {
      resolve: { alias: { 'match-box/core': fileURLToPath(new URL('../src/core/index.ts', import.meta.url)) } },
    }),
};

export default config;
```

`.storybook/env.d.ts`:

```ts
// Side-effect stylesheet imports, bundled by Vite.
declare module '*.css';
```

`.storybook/preview.ts`:

```ts
import { html, nothing } from 'lit';
import { setCustomElementsManifest, type Preview } from '@storybook/web-components-vite';
import manifest from '../dist/custom-elements.json' with { type: 'json' };
import '../src/tokens/tokens.css';
import '../src/components/define/all.ts';

// The same manifest as the Eleventy API tables: attributes, slots, parts, events, and CSS properties.
setCustomElementsManifest(manifest);

// What tokens.css does under prefers-reduced-motion: reduce. A page cannot emulate the media query.
const noMotion = '--mb-motion-duration-fast: 0ms; --mb-motion-duration-medium: 0ms; --mb-motion-duration-slow: 0ms;';

const preview: Preview = {
  parameters: { layout: 'fullscreen', controls: { expanded: true } },
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    motion: {
      description: 'Motion. Off sets every duration to 0ms, as under prefers-reduced-motion: reduce',
      toolbar: {
        title: 'Motion',
        icon: 'lightning',
        items: [
          { value: 'on', title: 'Motion on' },
          { value: 'off', title: 'Motion off' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'system', motion: 'on' },
  decorators: [
    (story, context) => {
      const theme = context.globals['theme'] as string | undefined;
      const motion = context.globals['motion'] as string | undefined;
      const style = [
        'box-sizing: border-box',
        'padding: 1rem',
        'background: var(--mb-color-bg-canvas)',
        'color: var(--mb-color-fg-default)',
        // A full-height canvas in the story view; docs pages stack stories, so they size to content.
        context.viewMode === 'docs' ? '' : 'min-height: 100vh',
      ].join('; ');
      return html`<div
        class="mb-story"
        data-theme=${theme === 'light' || theme === 'dark' ? theme : nothing}
        style="${style}; ${motion === 'off' ? noMotion : ''}"
      >
        ${story()}
      </div>`;
    },
  ],
};

export default preview;
```

`stories/Introduction.mdx`:

```mdx
import { Meta } from '@storybook/addon-docs/blocks';

<Meta title="Introduction" />

# match-box

Accessible behaviors, a Lit adapter, and styled components that share one set of design tokens.

This Storybook is the playground: every story has controls, and the toolbar switches the theme and turns motion off.
The rest of the documentation:

- <a href="../" target="_top">Guide</a>: installation, theming, patterns, and motion.
- <a href="../api/" target="_top">API reference</a> for the core, the Lit adapter, and the motion helpers.
```

`stories/__smoke__/fixtures.stories.ts`:

```ts
import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

// Built only with STORYBOOK_SMOKE_FIXTURE=1. Each story must make the smoke test fail.
const meta: Meta = { title: 'Smoke fixture' };
export default meta;

export const Throws: StoryObj = {
  render: () => {
    throw new Error('smoke fixture: render throws');
  },
};

export const LogsError: StoryObj = {
  render: () => {
    console.error('smoke fixture: logs an error');
    return html`<p>Logged an error.</p>`;
  },
};

export const AxeViolation: StoryObj = {
  render: () => html`<button></button>`,
};

export const Empty: StoryObj = {
  render: () => html``,
};
```

In `tsconfig.json`, change `"include"` to:

```json
  "include": ["src", "test", "stories", ".storybook", "vitest.config.ts"]
```

and add `"resolveJsonModule": true,` to `compilerOptions` after `"allowJs": true,`.

In `.gitignore`, add `storybook-static/` and `storybook-smoke-fixture/`.

- [ ] **Step 7: Add the smoke CLI**

`scripts/storybook-smoke.js`:

```js
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
```

In `package.json` `scripts`, add after `"docs:prefix-check"`:

```json
    "storybook": "npm run build && storybook dev -p 6006",
    "storybook:build": "npm run build && storybook build -o storybook-static",
    "storybook:smoke": "node scripts/storybook-smoke.js storybook-static",
    "storybook:smoke:self-test": "npm run build && STORYBOOK_SMOKE_FIXTURE=1 storybook build -o storybook-smoke-fixture && node scripts/storybook-smoke.js storybook-smoke-fixture --expect-fail smoke-fixture--throws,smoke-fixture--logs-error,smoke-fixture--axe-violation,smoke-fixture--empty",
```

- [ ] **Step 8: Run the self-test to verify the smoke test fails each fixture**

Run: `npm run storybook:smoke:self-test`
Expected: exit 0. The output has a `FAIL` line for each fixture in both themes, with reasons in this order of kind: `Throws` → a page error or the Storybook error display; `LogsError` → `console error: smoke fixture: logs an error`; `AxeViolation` → `axe: button-name (1)`; `Empty` → `nothing rendered within 5 s`. The last line is `ok   the smoke test failed the expected stories: …`.

If a fixture passes (the script exits 1 with `… passed but was expected to fail`), the smoke check for that failure kind is broken: fix `scripts/storybook-smoke.js`, not the fixture.

- [ ] **Step 9: Build the published Storybook and check it has no fixtures**

Run: `npm run storybook:build && node -e "const i=require('./storybook-static/index.json'); const ids=Object.keys(i.entries); if (ids.some((id) => id.startsWith('smoke-fixture'))) { console.error('fixtures leaked', ids); process.exit(1); } console.log('ok  ', ids.join(', '))"`
Expected: the build succeeds and the check prints `ok   introduction--docs` (the only entry so far).

Run: `npm run storybook:smoke`
Expected: exit 1 with `no stories found` — there are no stories yet; Task 3 adds them.

- [ ] **Step 10: Run the gates and commit**

Run: `npm run typecheck && npm run lint && npm run test:unit`
Expected: all pass.

```bash
git add scripts/lib/smoke.js scripts/storybook-smoke.js test/unit/scripts/smoke.test.ts .storybook stories package.json package-lock.json tsconfig.json .gitignore
git commit -m "Add Storybook with theme and motion toolbars, and a smoke test that must fail its fixtures"
```

---

### Task 3: Component stories

**Files:**
- Create: `stories/components/button.stories.ts`, `disclosure.stories.ts`, `accordion.stories.ts`, `dialog.stories.ts`, `listbox.stories.ts`

**Interfaces:**
- Consumes: Storybook config and `storybook:smoke` from Task 2; elements registered by `.storybook/preview.ts`.
- Produces: story titles `Components/Button`, `Components/Disclosure`, `Components/Accordion`, `Components/Dialog`, `Components/Listbox`.

- [ ] **Step 1: Button**

`stories/components/button.stories.ts`:

```ts
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface ButtonArgs {
  label: string;
  variant: string;
  color: string;
  size: string;
  href: string;
  disabled: boolean;
}

const colors = ['neutral', 'primary', 'secondary', 'tertiary', 'danger'];

const meta: Meta<ButtonArgs> = {
  title: 'Components/Button',
  component: 'mb-button',
  tags: ['autodocs'],
  args: { label: 'Button', variant: 'default', color: 'neutral', size: 'md', href: '', disabled: false },
  argTypes: {
    label: { control: 'text', description: 'Default slot content' },
    variant: { control: 'select', options: ['default', 'outline', 'ghost'] },
    color: { control: 'select', options: colors },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    href: { control: 'text' },
  },
  render: (args) =>
    html`<mb-button
      variant=${args.variant}
      color=${args.color}
      size=${args.size}
      href=${ifDefined(args.href || undefined)}
      ?disabled=${args.disabled}
      >${args.label}</mb-button
    >`,
};
export default meta;

type Story = StoryObj<ButtonArgs>;
const showcase = { parameters: { controls: { disable: true } } };
const row = 'display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;';

export const Playground: Story = {};

export const Variants: Story = {
  ...showcase,
  render: () =>
    html`<div style=${row}>
      <mb-button color="primary">Default</mb-button>
      <mb-button variant="outline" color="primary">Outline</mb-button>
      <mb-button variant="ghost" color="primary">Ghost</mb-button>
    </div>`,
};

export const Colors: Story = {
  ...showcase,
  render: () => html`<div style=${row}>${colors.map((color) => html`<mb-button color=${color}>${color}</mb-button>`)}</div>`,
};

export const Sizes: Story = {
  ...showcase,
  render: () =>
    html`<div style=${row}>
      <mb-button size="sm" color="primary">Small</mb-button>
      <mb-button color="primary">Medium</mb-button>
      <mb-button size="lg" color="primary">Large</mb-button>
    </div>`,
};

export const Link: Story = {
  ...showcase,
  render: () =>
    html`<div style=${row}>
      <mb-button href="#" variant="outline">Link</mb-button>
      <mb-button href="#" disabled>Disabled link</mb-button>
    </div>`,
};

export const Disabled: Story = {
  ...showcase,
  render: () => html`<mb-button disabled>Disabled</mb-button>`,
};
```

- [ ] **Step 2: Disclosure**

`stories/components/disclosure.stories.ts`:

```ts
import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface DisclosureArgs {
  summary: string;
  content: string;
  open: boolean;
  color: string;
  size: string;
}

const meta: Meta<DisclosureArgs> = {
  title: 'Components/Disclosure',
  component: 'mb-disclosure',
  tags: ['autodocs'],
  args: {
    summary: 'Shipping details',
    content: 'Orders ship within two business days.',
    open: false,
    color: 'neutral',
    size: 'md',
  },
  argTypes: {
    summary: { control: 'text', description: 'The `summary` slot' },
    content: { control: 'text', description: 'Default slot content' },
    color: { control: 'select', options: ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) =>
    html`<mb-disclosure ?open=${args.open} color=${args.color} size=${args.size}>
      <span slot="summary">${args.summary}</span>${args.content}
    </mb-disclosure>`,
};
export default meta;

type Story = StoryObj<DisclosureArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const Open: Story = { ...showcase, args: { open: true } };

export const Sizes: Story = {
  ...showcase,
  render: () =>
    html`${['sm', 'md', 'lg'].map(
      (size) =>
        html`<mb-disclosure size=${size}><span slot="summary">Size ${size}</span>A ${size} disclosure.</mb-disclosure>`,
    )}`,
};
```

- [ ] **Step 3: Accordion**

`stories/components/accordion.stories.ts`:

```ts
import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface AccordionArgs {
  multiple: boolean;
  size: string;
}

const meta: Meta<AccordionArgs> = {
  title: 'Components/Accordion',
  component: 'mb-accordion',
  tags: ['autodocs'],
  args: { multiple: false, size: 'md' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  render: (args) =>
    html`<mb-accordion ?multiple=${args.multiple} size=${args.size}>
      <mb-disclosure><span slot="summary">Shipping</span>Orders ship within two business days.</mb-disclosure>
      <mb-disclosure><span slot="summary">Returns</span>Return any item within 30 days.</mb-disclosure>
      <mb-disclosure><span slot="summary">Warranty</span>Two years on all hardware.</mb-disclosure>
    </mb-accordion>`,
};
export default meta;

type Story = StoryObj<AccordionArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const Single: Story = { ...showcase };

export const Multiple: Story = { ...showcase, args: { multiple: true } };

export const Sized: Story = { ...showcase, args: { size: 'sm' } };
```

- [ ] **Step 4: Dialog**

`stories/components/dialog.stories.ts`:

```ts
import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface DialogArgs {
  label: string;
  color: string;
  size: string;
  persistent: boolean;
}

// Dialogs open from a trigger, never on load, so a docs page does not fill with modals.
const openNext = (event: Event): void => {
  ((event.currentTarget as Element).nextElementSibling as HTMLElement & { show(): void }).show();
};

const dialog = (args: DialogArgs, trigger: string) =>
  html`<mb-button color=${args.color} @click=${openNext}>${trigger}</mb-button>
    <mb-dialog label=${args.label} color=${args.color} size=${args.size} ?persistent=${args.persistent}>
      <p>This removes the project and its history.</p>
      <form method="dialog" slot="footer">
        <mb-button type="submit" variant="ghost">Cancel</mb-button>
        <mb-button type="submit" color=${args.color} value="delete">Delete</mb-button>
      </form>
    </mb-dialog>`;

const meta: Meta<DialogArgs> = {
  title: 'Components/Dialog',
  component: 'mb-dialog',
  tags: ['autodocs'],
  args: { label: 'Delete project?', color: 'danger', size: 'md', persistent: false },
  argTypes: {
    color: { control: 'select', options: ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) => dialog(args, 'Delete project'),
};
export default meta;

type Story = StoryObj<DialogArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const Trigger: Story = { ...showcase };

export const Sizes: Story = {
  ...showcase,
  render: (args) =>
    html`<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
      ${['sm', 'md', 'lg'].map((size) => html`<div>${dialog({ ...args, size }, `Open ${size}`)}</div>`)}
    </div>`,
};
```

- [ ] **Step 5: Listbox**

`stories/components/listbox.stories.ts`:

```ts
import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface ListboxArgs {
  label: string;
  multiple: boolean;
  color: string;
  size: string;
  disabled: boolean;
}

const meta: Meta<ListboxArgs> = {
  title: 'Components/Listbox',
  component: 'mb-listbox',
  tags: ['autodocs'],
  args: { label: 'Fruit', multiple: false, color: 'neutral', size: 'md', disabled: false },
  argTypes: {
    color: { control: 'select', options: ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) =>
    html`<mb-listbox
      label=${args.label}
      ?multiple=${args.multiple}
      color=${args.color}
      size=${args.size}
      ?disabled=${args.disabled}
    >
      <mb-option>Apple</mb-option>
      <mb-option selected>Banana</mb-option>
      <mb-option>Cherry</mb-option>
      <mb-option>Date</mb-option>
    </mb-listbox>`,
};
export default meta;

type Story = StoryObj<ListboxArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const Single: Story = { ...showcase };

export const Multiple: Story = {
  ...showcase,
  render: () =>
    html`<mb-listbox label="Toppings" multiple color="tertiary">
      <mb-option value="nuts">Nuts</mb-option>
      <mb-option value="honey" selected>Honey</mb-option>
      <mb-option value="yogurt" selected>Yogurt</mb-option>
    </mb-listbox>`,
};

export const DisabledOptions: Story = {
  ...showcase,
  render: () =>
    html`<mb-listbox label="Fruit" color="primary">
      <mb-option>Apple</mb-option>
      <mb-option disabled>Banana</mb-option>
      <mb-option disabled>Cherry</mb-option>
      <mb-option>Date</mb-option>
    </mb-listbox>`,
};

export const Sizes: Story = {
  ...showcase,
  render: () =>
    html`<div style="display: flex; flex-wrap: wrap; align-items: start; gap: 1rem;">
      ${['sm', 'md', 'lg'].map(
        (size) =>
          html`<mb-listbox label="Size ${size}" size=${size}>
            <mb-option>Apple</mb-option>
            <mb-option selected>Banana</mb-option>
          </mb-listbox>`,
      )}
    </div>`,
};
```

- [ ] **Step 6: Build and smoke-test**

Run: `npm run storybook:build && npm run storybook:smoke`
Expected: exit 0, one `ok` line per story and theme for the 21 component stories (42 lines). A `FAIL` is a real problem in the story or the component: fix the story if its markup is wrong (for example a missing label); a component accessibility failure is out of scope — record it in the commit message and stop to report it.

- [ ] **Step 7: Check the dev server by hand**

Run `npm run storybook` and open `http://localhost:6006`. Each component's docs page lists its attributes from the manifest; the Playground controls change the element; the Theme toolbar switches the whole canvas between light and dark; Motion off stops the button's press and color transitions.

- [ ] **Step 8: Run the gates and commit**

Run: `npm run typecheck && npm run lint`
Expected: pass.

```bash
git add stories/components
git commit -m "Add Storybook stories for the five components"
```

---

### Task 4: Pattern and motion stories

**Files:**
- Create: `stories/patterns/listbox.stories.ts`, `disclosure.stories.ts`, `dialog.stories.ts`, `stories/motion/shared.ts`, `stories/motion/reveal.stories.ts`, `stagger.stories.ts`, `flip.stories.ts`, `exit.stories.ts`

**Interfaces:**
- Consumes: `mountListbox(container, spec)`, `mountDisclosure(container)`, `mountDialog(container)` from `site/demos/demos.js`; `reveal`, `stagger`, `flip`, `exit`, `MotionTiming` from `src/motion/index.ts`.
- Produces: story titles `Patterns/Listbox`, `Patterns/Disclosure`, `Patterns/Dialog`, `Motion/Reveal`, `Motion/Stagger`, `Motion/Flip`, `Motion/Exit`.

- [ ] **Step 1: Pattern stories**

`stories/patterns/listbox.stories.ts`:

```ts
import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { mountListbox } from '../../site/demos/demos.js';

// The plain-HTML demo the conformance suite runs (test/browser/demos.test.ts), styled just enough to see state.
const meta: Meta = { title: 'Patterns/Listbox', parameters: { controls: { disable: true } } };
export default meta;

const styles = html`<style>
  .pattern [role='listbox'] { display: grid; gap: 2px; max-inline-size: 12rem; margin-block-start: 0.5rem; }
  .pattern [role='option'] { padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
  .pattern [role='option'][aria-selected='true'] { background: var(--mb-color-primary-subtle); color: var(--mb-color-primary-text); }
  .pattern [role='option'][aria-disabled='true'] { color: var(--mb-color-fg-disabled); }
  .pattern :focus-visible { outline: var(--mb-focus-ring-width) solid var(--mb-color-border-focus); }
</style>`;

export const Listbox: StoryObj = {
  render: () => {
    const container = document.createElement('div');
    container.className = 'pattern';
    mountListbox(container, {
      multiple: false,
      options: [{ label: 'Apple' }, { label: 'Banana' }, { label: 'Cherry', disabled: true }, { label: 'Date' }],
    });
    return html`${styles}${container}`;
  },
};
```

`stories/patterns/disclosure.stories.ts`:

```ts
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { mountDisclosure } from '../../site/demos/demos.js';

const meta: Meta = { title: 'Patterns/Disclosure', parameters: { controls: { disable: true } } };
export default meta;

export const Disclosure: StoryObj = {
  render: () => {
    const container = document.createElement('div');
    mountDisclosure(container);
    return container;
  },
};
```

`stories/patterns/dialog.stories.ts`:

```ts
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { mountDialog } from '../../site/demos/demos.js';

const meta: Meta = { title: 'Patterns/Dialog', parameters: { controls: { disable: true } } };
export default meta;

export const Dialog: StoryObj = {
  render: () => {
    const container = document.createElement('div');
    mountDialog(container);
    return container;
  },
};
```

- [ ] **Step 2: Motion helpers for the stories**

`stories/motion/shared.ts`:

```ts
import { html } from 'lit';
import type { Meta } from '@storybook/web-components-vite';
import type { MotionTiming } from '../../src/motion/index.ts';

export interface MotionArgs {
  duration: 'fast' | 'medium' | 'slow' | number;
  easing: 'standard' | 'enter' | 'exit' | 'spring';
  interval: number;
}

export const motionArgs: MotionArgs = { duration: 'medium', easing: 'standard', interval: 40 };

export const motionArgTypes: Meta<MotionArgs>['argTypes'] = {
  duration: {
    control: 'select',
    options: ['fast', 'medium', 'slow', 1000],
    description: 'A duration token name, or milliseconds',
  },
  easing: {
    control: 'select',
    options: ['standard', 'enter', 'exit', 'spring'],
    description: 'An easing token name',
  },
  interval: { control: { type: 'range', min: 0, max: 200, step: 10 }, description: 'Milliseconds between elements' },
};

/** The args as helper options. */
export const timing = ({ duration, easing }: MotionArgs): MotionTiming => ({ duration, easing });

export const fadeUp: Keyframe[] = [
  { opacity: 0, transform: 'translateY(0.5rem)' },
  { opacity: 1, transform: 'none' },
];

export const fruit = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

export const styles = html`<style>
  .motion-demo { display: grid; gap: 0.75rem; max-inline-size: 22rem; }
  .motion-demo .row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .motion-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
  .motion-list li {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.5rem 0.75rem; border: 1px solid var(--mb-color-border-default);
    border-radius: var(--mb-radius-surface); background: var(--mb-color-bg-surface);
  }
</style>`;

/** The demo root around an event's target. */
export const demoOf = (event: Event): Element => (event.currentTarget as Element).closest('.motion-demo')!;

/**
 * Fills `list` with plain DOM items. Stories that move or remove items build them this way:
 * Lit's markers for a rendered list would break when the helpers reorder its children.
 */
export function fillList(list: Element, names: readonly string[], removable = false): void {
  list.replaceChildren(
    ...names.map((name) => {
      const item = document.createElement('li');
      item.append(name);
      if (removable) {
        const button = document.createElement('mb-button');
        button.setAttribute('size', 'sm');
        button.setAttribute('variant', 'ghost');
        button.dataset['remove'] = '';
        button.textContent = 'Remove';
        item.append(' ', button);
      }
      return item;
    }),
  );
}
```

- [ ] **Step 3: Stagger and Reveal**

`stories/motion/stagger.stories.ts`:

```ts
import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { stagger } from '../../src/motion/index.ts';
import { demoOf, fadeUp, fruit, motionArgTypes, motionArgs, styles, timing, type MotionArgs } from './shared.ts';

const meta: Meta<MotionArgs> = { title: 'Motion/Stagger', args: motionArgs, argTypes: motionArgTypes };
export default meta;

// A replay aborts the one before it, so repeated clicks never stack animations.
let controller: AbortController | undefined;

export const Stagger: StoryObj<MotionArgs> = {
  render: (args) => {
    const play = (event: Event): void => {
      controller?.abort();
      controller = new AbortController();
      const list = demoOf(event).querySelector('.motion-list')!;
      void stagger(list.children, fadeUp, { ...timing(args), interval: args.interval, signal: controller.signal });
    };
    return html`${styles}
      <div class="motion-demo">
        <div class="row"><mb-button color="primary" @click=${play}>Replay</mb-button></div>
        <ul class="motion-list">
          ${fruit.map((name) => html`<li>${name}</li>`)}
        </ul>
      </div>`;
  },
};
```

`stories/motion/reveal.stories.ts`:

```ts
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { reveal } from '../../src/motion/index.ts';
import { demoOf, motionArgTypes, motionArgs, styles, timing, type MotionArgs } from './shared.ts';

const meta: Meta<MotionArgs> = {
  title: 'Motion/Reveal',
  args: { ...motionArgs, easing: 'enter' },
  argTypes: motionArgTypes,
};
export default meta;

let stop: (() => void) | undefined;

export const Reveal: StoryObj<MotionArgs> = {
  render: (args) => {
    const start = (demo: Element): void => {
      stop?.();
      stop = reveal(demo.querySelectorAll('.reveal-card'), { ...timing(args), interval: args.interval });
    };
    const replay = (event: Event): void => {
      const demo = demoOf(event);
      for (const card of demo.querySelectorAll('.reveal-card')) for (const animation of card.getAnimations()) animation.cancel();
      window.scrollTo(0, 0);
      start(demo);
    };
    return html`${styles}
      <div
        class="motion-demo"
        ${ref((demo) => {
          if (demo) start(demo);
        })}
      >
        <div class="row"><mb-button color="primary" @click=${replay}>Replay</mb-button></div>
        <p>Scroll down: each card fades up the first time it enters the view.</p>
        <ul class="motion-list">
          ${Array.from({ length: 12 }, (_, index) => html`<li class="reveal-card" style="min-block-size: 6rem">Card ${index + 1}</li>`)}
        </ul>
      </div>`;
  },
};
```

- [ ] **Step 4: Flip and Exit**

`stories/motion/flip.stories.ts`:

```ts
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { flip, stagger } from '../../src/motion/index.ts';
import { demoOf, fadeUp, fillList, fruit, motionArgTypes, motionArgs, styles, timing, type MotionArgs } from './shared.ts';

const meta: Meta<MotionArgs> = {
  title: 'Motion/Flip',
  args: motionArgs,
  argTypes: { ...motionArgTypes, interval: { table: { disable: true } } },
};
export default meta;

let added = 0;

export const Flip: StoryObj<MotionArgs> = {
  render: (args) => {
    const listOf = (event: Event): Element => demoOf(event).querySelector('.motion-list')!;
    const shuffle = (event: Event): void => {
      const list = listOf(event);
      const items = [...list.children];
      void flip(
        items,
        () => {
          for (const item of [...items].sort(() => Math.random() - 0.5)) list.append(item);
        },
        timing(args),
      );
    };
    const add = (event: Event): void => {
      const list = listOf(event);
      const item = document.createElement('li');
      item.textContent = `Item ${(added += 1)}`;
      void flip([...list.children], () => list.prepend(item), timing(args));
      void stagger(item, fadeUp, timing(args));
    };
    return html`${styles}
      <div class="motion-demo">
        <div class="row">
          <mb-button color="primary" @click=${add}>Add</mb-button>
          <mb-button @click=${shuffle}>Shuffle</mb-button>
        </div>
        <ul
          class="motion-list"
          ${ref((list) => {
            if (list) fillList(list, fruit);
          })}
        ></ul>
      </div>`;
  },
};
```

`stories/motion/exit.stories.ts`:

```ts
import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { exit, flip } from '../../src/motion/index.ts';
import { demoOf, fillList, fruit, motionArgTypes, motionArgs, styles, timing, type MotionArgs } from './shared.ts';

const meta: Meta<MotionArgs> = {
  title: 'Motion/Exit',
  args: motionArgs,
  argTypes: { ...motionArgTypes, interval: { table: { disable: true } } },
};
export default meta;

export const Exit: StoryObj<MotionArgs> = {
  render: (args) => {
    const remove = (event: Event): void => {
      const button = (event.target as Element).closest('[data-remove]');
      const item = button?.closest('li');
      if (!item) return;
      // exit() does not move focus: send it to a neighbor, or to Reset, before the item goes.
      const neighbor = item.nextElementSibling ?? item.previousElementSibling;
      const next = neighbor?.querySelector<HTMLElement>('[data-remove]') ?? demoOf(event).querySelector<HTMLElement>('[data-reset]');
      next?.focus();
      const siblings = [...item.parentElement!.children].filter((other) => other !== item);
      void flip(siblings, () => exit(item, timing(args)), timing(args));
    };
    const reset = (event: Event): void => {
      fillList(demoOf(event).querySelector('.motion-list')!, fruit, true);
    };
    return html`${styles}
      <div class="motion-demo">
        <div class="row"><mb-button data-reset @click=${reset}>Reset</mb-button></div>
        <ul
          class="motion-list"
          @click=${remove}
          ${ref((list) => {
            if (list) fillList(list, fruit, true);
          })}
        ></ul>
      </div>`;
  },
};
```

- [ ] **Step 5: Build and smoke-test**

Run: `npm run storybook:build && npm run storybook:smoke`
Expected: exit 0; `ok` for every story in both themes (21 component stories and 7 pattern and motion stories: 56 lines). Fix any `FAIL` in the story.

- [ ] **Step 6: Check the motion stories by hand**

Run `npm run storybook`, open each Motion story with the window in front: Stagger replays and clicking Replay rapidly never leaves items half faded; Reveal fades cards up while scrolling and Replay starts over; Flip shuffles and adds with sliding; Exit fades an item out, the rest close the gap, and focus lands on a neighbor's Remove. With Motion off in the toolbar, every button works without animation. Changing `duration` to `1000` slows every effect.

- [ ] **Step 7: Run the gates and commit**

Run: `npm run typecheck && npm run lint`
Expected: pass.

```bash
git add stories/patterns stories/motion
git commit -m "Add Storybook stories for the headless patterns and the motion helpers"
```

---

### Task 5: CI, the Pages workflow, and docs

**Files:**
- Create: `.github/workflows/pages.yml`
- Modify: `.github/workflows/ci.yml`, `README.md`, `site/index.md`

**Interfaces:**
- Consumes: npm scripts `docs`, `docs:prefix-check`, `storybook:build`, `storybook:smoke`, `storybook:smoke:self-test` from Tasks 1–2.

- [ ] **Step 1: CI steps**

In `.github/workflows/ci.yml`, after `- run: npm run docs`, add:

```yaml
      - run: npm run docs:prefix-check
      - run: npm run storybook:build
      - run: npm run storybook:smoke
      - run: npm run storybook:smoke:self-test
```

- [ ] **Step 2: Pages workflow**

`.github/workflows/pages.yml`:

```yaml
name: Pages

on:
  push:
    tags: ['v*']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      # Tags are cut from main, which CI has checked; this job only builds.
      - run: npm run docs
        env:
          ELEVENTY_PATH_PREFIX: /match-box/
      - run: npm run storybook:build
      - run: cp -R storybook-static _site/storybook
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: _site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Build the Pages site locally and check it**

Run: `ELEVENTY_PATH_PREFIX=/match-box/ npm run docs && npm run storybook:build && rm -rf _site/storybook && cp -R storybook-static _site/storybook && node scripts/check-site-prefix.js _site /match-box/`
Expected: `ok   every local URL in _site starts with /match-box/` (Eleventy pages prefixed, TypeDoc and Storybook relative).

Run: `node -e "const i=require('./_site/storybook/index.json'); if (Object.keys(i.entries).some((id) => id.startsWith('smoke-fixture'))) process.exit(1); console.log('ok   no fixtures in the published Storybook')"`
Expected: `ok   no fixtures in the published Storybook`.

Then serve it under the prefix and look. In a scratch directory (not the repo), link the site as `match-box` and serve its parent: `mkdir -p <scratch>/pages-check && ln -sfn "$PWD/_site" <scratch>/pages-check/match-box && python3 -m http.server 8090 --directory <scratch>/pages-check`. Open `http://localhost:8090/match-box/`: the nav links, a component demo, a pattern demo, and the Motion page work; `/match-box/api/` loads; `/match-box/storybook/` loads, and its Introduction's Guide and API links open the guide and the API in the top window. The console shows no errors. Stop the server and run `npm run docs` again to restore the local `_site`.

- [ ] **Step 4: Docs**

In `README.md`, after the first paragraph under `# match-box`, add:

```markdown
Documentation: [guide, API reference, and Storybook](https://heartlex.github.io/match-box/).
```

and in the `## Develop` code block, after `npm run docs      # builds the site into _site`, add:

```sh
npm run storybook # Storybook on http://localhost:6006
npm run storybook:build && npm run storybook:smoke  # static build, every story checked with axe
```

In `site/index.md`, change the last line from

```markdown
[Dialog](/patterns/dialog/). Full reference: [API](/api/).
```

to

```markdown
[Dialog](/patterns/dialog/). Full reference: [API](/api/). Every component,
pattern, and motion helper is also in [Storybook](/storybook/).
```

- [ ] **Step 5: Run every gate**

Run: `npm run typecheck && npm run lint && npm run test:unit && npm run test:browser && npm run size && npm run docs && npm run docs:prefix-check && npm run storybook:build && npm run storybook:smoke && npm run storybook:smoke:self-test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ci.yml .github/workflows/pages.yml README.md site/index.md
git commit -m "Smoke-test Storybook in CI and publish the site to GitHub Pages on release tags"
```

- [ ] **Step 7: Enable Pages (ask first)**

Pages must be enabled with source "GitHub Actions". This changes a repository setting: ask the user before running, or let them flip it in Settings → Pages. With approval:

Run: `GH_TOKEN=$(gh auth token --user heartlex) gh api -X POST repos/heartlex/match-box/pages -f build_type=workflow`
Expected: JSON with `"build_type": "workflow"`. A `409` means Pages is already enabled; check with `gh api repos/heartlex/match-box/pages`.

The first publish (a manual run of `pages.yml` on `main`) happens after this branch merges; it is not part of this plan.
