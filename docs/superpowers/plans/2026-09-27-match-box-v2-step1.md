# match-box v2 step 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `match-box` 0.2.0: five color roles in the tokens, an accordion behavior in the core, and the first styled components (`mb-button`, `mb-disclosure`, `mb-accordion`, `mb-dialog`, `mb-listbox` with `mb-option`), with docs generated from a custom-elements manifest.

**Architecture:** Components are Lit elements under `src/components`, exported as classes from `match-box/components` and registered only by `match-box/components/define/<name>.js`. Each wraps a v1 Lit controller around shadow-DOM markup; ARIA stays with the core, which writes it on light-DOM children such as `mb-option`. Colors come from two axes: `color` picks one of five role token groups, `variant` picks the structure.

**Tech Stack:** As v1 (TypeScript ~6.0, Lit 3, Vitest 5, `@web/test-runner` with Playwright on Chromium, Firefox, WebKit, Mocha, Chai, axe-core, ESLint, Eleventy 3, TypeDoc), plus `@custom-elements-manifest/analyzer` 0.11.

**Spec:** `docs/superpowers/specs/2026-09-27-match-box-v2-step1-design.md` (builds on `docs/superpowers/specs/2026-09-18-match-box-design.md`)

## Global Constraints

- Every commit is authored and committed by `heartlex <gianluca.strada@studio.unibo.it>`; the repo's local git config already sets this. Commit messages carry no `Co-Authored-By` trailer.
- All v1 constraints hold: ESM only; `.ts` extensions in relative imports; `strict`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`; no `window` or `document` access at module scope in `src/core`, `src/lit`, or `src/components`; `core` never imports `lit`; every browser test passes on Chromium, Firefox, and WebKit.
- `customElements.define` appears only in `src/components/shared/define.ts`, called only from `src/components/define/*.ts`.
- Components import the v1 controllers and mixins from `src/lit`, never `src/core/dom`.
- All custom properties carry the `--mb-` prefix. Component tokens are `--mb-<component>-<property>[-<state>]` and are never declared on `:host`.
- Private styling properties start with `--_` and are set only by `colorRoleStyles` classes (and `--_check-display` on the listbox).
- A custom element constructor never sets attributes; `attachInternals()` and listeners are fine.
- Contrast: per role and theme, `on-solid` on `solid` and `solid-hover`, and `text` on the surface and on `subtle`, at least 4.5:1; `border` on the surface at least 3:1.

## Decisions made while planning

A throwaway spike built this whole step before the plan was written. It was then replayed task by task on a fresh clone of `main`: each task's red run failed, each green run passed, and three planted bugs were caught. The final tree ran typecheck, lint, 39 unit tests, 289 browser tests on each engine, the size check, and the docs build. The spike settled these points the spec left open or got wrong:

1. **`mb-listbox` forwards focus itself.** `delegatesFocus` does not reach slotted light-DOM options: `host.focus()` and a `<label for>` click left focus on `body` in all three engines. `MbListbox` overrides `focus()` and treats a click targeting the host (a label activation) as a focus request, moving focus to the active option.
2. **`open` on `mb-disclosure` and `mb-dialog` is a synchronous accessor over the controller state.** Applying it in `willUpdate` let an accordion attach before its disclosures had opened, so the last open one won instead of the first.
3. **`attachDialog`'s `dismissOnOutsideClick` accepts a function,** read at click time, so `persistent` can change after attach.
4. **The dialog suite checks focus through shadow roots.** It uses `containsComposed` (exported from `core/testing`), because focus lands inside the close button's own shadow root.
5. **`AccordionState`'s open set is `openKeys`,** since a getter named `open` clashes with the `open()` action.
6. **`mb-accordion` defaults `heading-level` to 3.** The APG requires accordion triggers inside headings.
7. **The `define()` helper lives in `shared/`,** so the `./components/define/*.js` export pattern exposes only registration modules.
8. **Templates may write static ARIA the core never writes**: `role="heading"` and `aria-level` around a trigger, and `aria-hidden` on a decorative icon. The single-writer rule holds per attribute; `docs/styling-contract.md` says so.
9. **`variant` and `color` are not reflected,** so hosts gain no attributes they were not given. Unknown values fall back to `default` and `neutral`.
10. **The docs site serves Lit from `node_modules` through an import map,** renders Markdown with Nunjucks, and lists a page's tags under the front-matter key `api`, because `tags` is reserved by Eleventy.
11. **Test setup for platform rules**: axe runs on the theme's surface color, because dark text colors are designed for dark surfaces. The Escape test clicks inside the dialog first, because browsers honor a prevented `cancel` only after a user activation.

## Review Focus

1. **Disclosures that start open inside an accordion.** Attributes reach elements at upgrade, before the accordion attaches. Single mode must keep the first open item. Tests: Task 4 (`attachAccordion`) and Task 7 (`mb-accordion`).
2. **Focus across the shadow boundary.** A `<label for>` click, `listbox.focus()`, and the dialog's initial focus all cross shadow roots or slots. Tests: Task 8 (dialog conformance) and Task 9 ("focus() and a label click move focus to the active option").
3. **A light-DOM `<form method="dialog">` inside `mb-dialog`** must close the dialog with the submitter's value, although the platform will not. Tests: Task 8.
4. **Every color × variant in both themes** must stay readable and pass axe. Tests: Task 1 (contrast for all roles) and Task 10 (axe on the themed surface).
5. **Bundling.** Importing a class must not register a tag, and a define import must survive tree-shaking. Check: Task 11 Step 5.

---

## File Structure

```text
src/tokens/tokens.css                  + five color roles (Task 1)
src/core/state/listbox.ts              + setMultiple (Task 2)
src/core/state/accordion.ts            AccordionState (Task 3)
src/core/dom/accordion.ts              attachAccordion (Task 4)
src/core/dom/dialog.ts                 dismissOnOutsideClick may be a function (Task 8)
src/core/testing/accordion.ts          accordionConformance (Task 4)
src/core/testing/driver.ts             + containsComposed (Task 8)
src/lit/controllers.ts                 + AccordionController (Task 7)
src/components/shared/                 color roles, shared styles, define() (Task 5)
src/components/<name>/                 element + styles per component (Tasks 5 to 9)
src/components/define/                 one registration module per component + all.ts
src/components/index.ts                class exports
test/support/components.ts             mount, settle, part, resolveColor, loadTokens
test/browser/components/               per-component, conformance, and styling tests
custom-elements-manifest.config.js     manifest generation (Task 11)
site/components/, site/theming.md      component and theming pages (Task 12)
site/_data/elements.js, site/_includes/api.njk   API tables from the manifest
```


---

### Task 1: Color-role tokens

**Files:**
- `test/browser/tokens.test.ts`
- `src/tokens/tokens.css`
- `site/_includes/layout.njk`

**Interfaces:**
- Produces: 30 semantic tokens `--mb-color-<role>-<name>` for roles `neutral`, `primary`, `secondary`, `tertiary`, `danger` and names `solid`, `solid-hover`, `on-solid`, `text`, `subtle`, `border`, in light, dark, and the prefers-dark media block. Removes `--mb-color-bg-accent`, `-bg-accent-hover`, `-fg-on-accent`, `-fg-accent`, `-bg-danger`, `-fg-danger`, `-border-danger`, and the unused `--mb-red-500` primitive. Adds primitives `blue-50`, `blue-950`, `violet-50/300/400/600/700/950`, `teal-50/300/400/700/800/950`, `red-50/700/950`.
- The palette's contrast was computed during planning: the lowest text pair is 5.34:1 (light tertiary `text` on `subtle`) and the lowest border is 3.24:1 (light neutral).

The docs layout referenced two removed tokens; the edit in Step 3 points it at the primary role until Task 12 replaces the layout.

- [ ] **Step 1: Write the failing tests**

`test/browser/tokens.test.ts`:

```ts
import { expect } from 'chai';
import { emulateMedia } from '@web/test-runner-commands';

const tokensUrl = new URL('../../src/tokens/tokens.css', import.meta.url).href;
let sheet: CSSStyleSheet;

type Block = Map<string, string>;

function styleRules(rules: CSSRuleList): CSSStyleRule[] {
  return [...rules].flatMap((rule) => {
    if (rule instanceof CSSStyleRule) return [rule];
    if (rule instanceof CSSMediaRule) return styleRules(rule.cssRules);
    return [];
  });
}

/** Custom properties declared by the rule with `selector`, including rules inside @media. */
function block(selector: string): Block {
  const rule = styleRules(sheet.cssRules).find((r) => r.selectorText === selector);
  if (rule === undefined) throw new Error(`no rule for ${selector}`);
  const declared: Block = new Map();
  for (const name of rule.style) {
    if (name.startsWith('--')) declared.set(name, rule.style.getPropertyValue(name).trim());
  }
  return declared;
}

function token(name: string, element: Element = document.documentElement): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (high + 0.05) / (low + 0.05);
}

const roles = ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] as const;
const roleTokens = ['solid', 'solid-hover', 'on-solid', 'text', 'subtle', 'border'] as const;

const textPairs: [string, string][] = [
  ['--mb-color-fg-default', '--mb-color-bg-surface'],
  ['--mb-color-fg-default', '--mb-color-bg-canvas'],
  ['--mb-color-fg-muted', '--mb-color-bg-surface'],
  ['--mb-color-fg-subtle', '--mb-color-bg-surface'],
  ['--mb-color-fg-success', '--mb-color-bg-surface'],
  ...roles.flatMap((role): [string, string][] => [
    [`--mb-color-${role}-on-solid`, `--mb-color-${role}-solid`],
    [`--mb-color-${role}-on-solid`, `--mb-color-${role}-solid-hover`],
    [`--mb-color-${role}-text`, '--mb-color-bg-surface'],
    [`--mb-color-${role}-text`, `--mb-color-${role}-subtle`],
  ]),
];

const nonTextPairs: [string, string][] = [
  ['--mb-color-border-focus', '--mb-color-bg-surface'],
  ['--mb-color-border-strong', '--mb-color-bg-surface'],
  ...roles.map((role): [string, string] => [`--mb-color-${role}-border`, '--mb-color-bg-surface']),
];

describe('tokens.css', () => {
  before(async () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = tokensUrl;
    const loaded = new Promise((resolve) => link.addEventListener('load', resolve));
    document.head.append(link);
    await loaded;
    sheet = link.sheet as CSSStyleSheet;
  });

  afterEach(async () => {
    document.documentElement.removeAttribute('data-theme');
    document.body.replaceChildren();
    await emulateMedia({ colorScheme: 'light' });
  });

  it('prefixes every custom property with --mb-', () => {
    const names = styleRules(sheet.cssRules).flatMap((rule) => [...rule.style].filter((n) => n.startsWith('--')));
    expect(names.length).to.be.greaterThan(60);
    for (const name of names) expect(name).to.match(/^--mb-/);
  });

  it('names semantic tokens category-role-modifier in lowercase', () => {
    for (const name of block(':root, [data-theme="light"]').keys()) {
      expect(name).to.match(/^--mb-[a-z]+(-[a-z0-9]+)+$/);
    }
  });

  it('dark blocks override exactly the color and shadow tokens, identically', () => {
    const light = block(':root, [data-theme="light"]');
    const dark = block('[data-theme="dark"]');
    const media = block(':root:not([data-theme="light"])');
    const themed = [...light.keys()].filter((name) => /^--mb-(color|shadow)-/.test(name));
    expect([...dark.keys()].sort()).to.deep.equal(themed.sort());
    expect([...media.entries()]).to.deep.equal([...dark.entries()]);
  });

  it('defines six tokens for each of the five color roles in both themes', () => {
    const expected = roles.flatMap((role) => roleTokens.map((name) => `--mb-color-${role}-${name}`));
    const light = [...block(':root, [data-theme="light"]').keys()];
    const dark = [...block('[data-theme="dark"]').keys()];
    for (const name of expected) {
      expect(light, `light ${name}`).to.include(name);
      expect(dark, `dark ${name}`).to.include(name);
    }
    const declared = [...light, ...dark].filter((name) => /^--mb-color-(neutral|primary|secondary|tertiary|danger)-/.test(name));
    expect(declared.length).to.equal(expected.length * 2);
  });

  it('semantic tokens reference only primitives', () => {
    const primitives = block(':root');
    for (const [name, value] of [...block(':root, [data-theme="light"]'), ...block('[data-theme="dark"]')]) {
      for (const [, referenced] of value.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
        expect(primitives.has(referenced), `${name} references ${referenced}`).to.equal(true);
      }
    }
  });

  it('applies light values by default and dark values under data-theme="dark"', () => {
    expect(token('--mb-color-bg-surface')).to.equal('#ffffff');
    const subtree = document.createElement('div');
    subtree.dataset['theme'] = 'dark';
    document.body.append(subtree);
    expect(token('--mb-color-bg-surface', subtree)).to.equal('#18181b');
  });

  it('follows the system dark preference unless light is forced', async () => {
    await emulateMedia({ colorScheme: 'dark' });
    expect(token('--mb-color-bg-surface')).to.equal('#18181b');
    document.documentElement.dataset['theme'] = 'light';
    expect(token('--mb-color-bg-surface')).to.equal('#ffffff');
  });

  it('a light subtree inside a dark page gets light values', async () => {
    await emulateMedia({ colorScheme: 'dark' });
    const subtree = document.createElement('div');
    subtree.dataset['theme'] = 'light';
    document.body.append(subtree);
    expect(token('--mb-color-bg-surface', subtree)).to.equal('#ffffff');
  });

  for (const theme of ['light', 'dark']) {
    it(`meets WCAG AA contrast in the ${theme} theme`, () => {
      document.documentElement.dataset['theme'] = theme;
      for (const [fg, bg] of textPairs) {
        expect(contrast(token(fg), token(bg)), `${fg} on ${bg}`).to.be.at.least(4.5);
      }
      for (const [fg, bg] of nonTextPairs) {
        expect(contrast(token(fg), token(bg)), `${fg} on ${bg}`).to.be.at.least(3);
      }
    });
  }
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx web-test-runner --files test/browser/tokens.test.ts`
Expected: FAIL in all three browsers: "defines six tokens for each of the five color roles" fails (`--mb-color-neutral-solid` is missing), and so do both contrast tests (a missing token resolves to an empty string).

- [ ] **Step 3: Implement**

In `site/_includes/layout.njk`, replace:

```html
      [role='option'][aria-selected='true'] {
        background: var(--mb-color-bg-accent);
        color: var(--mb-color-fg-on-accent);
      }
```

with:

```html
      [role='option'][aria-selected='true'] {
        background: var(--mb-color-primary-subtle);
        color: var(--mb-color-primary-text);
      }
```

`src/tokens/tokens.css`:

```css
/*
 * match-box tokens. Written by hand.
 *
 * 1. Primitives: private. Only the semantic tier below may reference them.
 * 2. Semantic tokens, light values: public API. Includes the five color
 *    roles (neutral, primary, secondary, tertiary, danger), six tokens each:
 *    solid, solid-hover, on-solid, text, subtle, border.
 * 3. Semantic tokens, dark values: explicit [data-theme="dark"], and the
 *    same values when the system prefers dark and no light theme is forced.
 *
 * Set data-theme on any ancestor to theme a subtree.
 */

/* 1. Primitives */
:root {
  --mb-gray-0: #ffffff;
  --mb-gray-50: #f7f7f8;
  --mb-gray-100: #ebebee;
  --mb-gray-200: #d7d7dc;
  --mb-gray-300: #b9b9c1;
  --mb-gray-400: #8e8e99;
  --mb-gray-500: #6b6b76;
  --mb-gray-600: #52525b;
  --mb-gray-700: #3d3d44;
  --mb-gray-800: #27272c;
  --mb-gray-900: #18181b;
  --mb-gray-950: #0e0e10;
  --mb-blue-50: #e8effc;
  --mb-blue-300: #8cb4ff;
  --mb-blue-400: #5b93f5;
  --mb-blue-500: #2f6fe0;
  --mb-blue-600: #1f57c0;
  --mb-blue-700: #17449a;
  --mb-blue-950: #1a2a4a;
  --mb-violet-50: #f0ebfb;
  --mb-violet-300: #c2adf7;
  --mb-violet-400: #a283f0;
  --mb-violet-600: #6b3fc9;
  --mb-violet-700: #56309f;
  --mb-violet-950: #2c2148;
  --mb-teal-50: #e3f3f1;
  --mb-teal-300: #6fd4ca;
  --mb-teal-400: #2fb8ab;
  --mb-teal-700: #0b6e67;
  --mb-teal-800: #085752;
  --mb-teal-950: #123532;
  --mb-red-50: #fbeceb;
  --mb-red-300: #ff9a93;
  --mb-red-400: #f0625a;
  --mb-red-600: #b62a20;
  --mb-red-700: #93211a;
  --mb-red-950: #43201e;
  --mb-green-300: #7fd49a;
  --mb-green-600: #1f7a3d;
  --mb-space-1: 0.25rem;
  --mb-space-2: 0.5rem;
  --mb-space-3: 0.75rem;
  --mb-space-4: 1rem;
  --mb-radius-2: 0.25rem;
  --mb-radius-3: 0.5rem;
  --mb-font-sans: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --mb-font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  --mb-font-size-1: 0.875rem;
  --mb-font-size-2: 1rem;
  --mb-font-weight-bold: 600;
}

/* 2. Semantic tokens, light */
:root,
[data-theme='light'] {
  color-scheme: light;
  --mb-color-bg-canvas: var(--mb-gray-50);
  --mb-color-bg-surface: var(--mb-gray-0);
  --mb-color-bg-surface-raised: var(--mb-gray-0);
  --mb-color-bg-disabled: var(--mb-gray-100);
  --mb-color-fg-default: var(--mb-gray-900);
  --mb-color-fg-muted: var(--mb-gray-600);
  --mb-color-fg-subtle: var(--mb-gray-500);
  --mb-color-fg-success: var(--mb-green-600);
  --mb-color-fg-disabled: var(--mb-gray-400);
  --mb-color-border-default: var(--mb-gray-200);
  --mb-color-border-strong: var(--mb-gray-400);
  --mb-color-border-focus: var(--mb-blue-500);
  --mb-color-neutral-solid: var(--mb-gray-100);
  --mb-color-neutral-solid-hover: var(--mb-gray-200);
  --mb-color-neutral-on-solid: var(--mb-gray-900);
  --mb-color-neutral-text: var(--mb-gray-900);
  --mb-color-neutral-subtle: var(--mb-gray-100);
  --mb-color-neutral-border: var(--mb-gray-400);
  --mb-color-primary-solid: var(--mb-blue-600);
  --mb-color-primary-solid-hover: var(--mb-blue-700);
  --mb-color-primary-on-solid: var(--mb-gray-0);
  --mb-color-primary-text: var(--mb-blue-600);
  --mb-color-primary-subtle: var(--mb-blue-50);
  --mb-color-primary-border: var(--mb-blue-600);
  --mb-color-secondary-solid: var(--mb-violet-600);
  --mb-color-secondary-solid-hover: var(--mb-violet-700);
  --mb-color-secondary-on-solid: var(--mb-gray-0);
  --mb-color-secondary-text: var(--mb-violet-600);
  --mb-color-secondary-subtle: var(--mb-violet-50);
  --mb-color-secondary-border: var(--mb-violet-600);
  --mb-color-tertiary-solid: var(--mb-teal-700);
  --mb-color-tertiary-solid-hover: var(--mb-teal-800);
  --mb-color-tertiary-on-solid: var(--mb-gray-0);
  --mb-color-tertiary-text: var(--mb-teal-700);
  --mb-color-tertiary-subtle: var(--mb-teal-50);
  --mb-color-tertiary-border: var(--mb-teal-700);
  --mb-color-danger-solid: var(--mb-red-600);
  --mb-color-danger-solid-hover: var(--mb-red-700);
  --mb-color-danger-on-solid: var(--mb-gray-0);
  --mb-color-danger-text: var(--mb-red-600);
  --mb-color-danger-subtle: var(--mb-red-50);
  --mb-color-danger-border: var(--mb-red-600);
  --mb-shadow-overlay: 0 8px 24px rgb(0 0 0 / 0.16);
  --mb-space-inline-sm: var(--mb-space-2);
  --mb-space-inline-md: var(--mb-space-3);
  --mb-space-inline-lg: var(--mb-space-4);
  --mb-space-stack-sm: var(--mb-space-1);
  --mb-space-stack-md: var(--mb-space-2);
  --mb-space-stack-lg: var(--mb-space-4);
  --mb-radius-control: var(--mb-radius-2);
  --mb-radius-surface: var(--mb-radius-3);
  --mb-font-family-body: var(--mb-font-sans);
  --mb-font-family-code: var(--mb-font-mono);
  --mb-font-size-body: var(--mb-font-size-2);
  --mb-font-size-small: var(--mb-font-size-1);
  --mb-font-weight-strong: var(--mb-font-weight-bold);
  --mb-line-height-body: 1.5;
  --mb-focus-ring-width: 2px;
}

/* 3. Semantic tokens, dark. Keep the two blocks below identical. */
[data-theme='dark'] {
  color-scheme: dark;
  --mb-color-bg-canvas: var(--mb-gray-950);
  --mb-color-bg-surface: var(--mb-gray-900);
  --mb-color-bg-surface-raised: var(--mb-gray-800);
  --mb-color-bg-disabled: var(--mb-gray-800);
  --mb-color-fg-default: var(--mb-gray-50);
  --mb-color-fg-muted: var(--mb-gray-300);
  --mb-color-fg-subtle: var(--mb-gray-400);
  --mb-color-fg-success: var(--mb-green-300);
  --mb-color-fg-disabled: var(--mb-gray-600);
  --mb-color-border-default: var(--mb-gray-700);
  --mb-color-border-strong: var(--mb-gray-500);
  --mb-color-border-focus: var(--mb-blue-400);
  --mb-color-neutral-solid: var(--mb-gray-800);
  --mb-color-neutral-solid-hover: var(--mb-gray-700);
  --mb-color-neutral-on-solid: var(--mb-gray-50);
  --mb-color-neutral-text: var(--mb-gray-50);
  --mb-color-neutral-subtle: var(--mb-gray-800);
  --mb-color-neutral-border: var(--mb-gray-500);
  --mb-color-primary-solid: var(--mb-blue-400);
  --mb-color-primary-solid-hover: var(--mb-blue-300);
  --mb-color-primary-on-solid: var(--mb-gray-950);
  --mb-color-primary-text: var(--mb-blue-300);
  --mb-color-primary-subtle: var(--mb-blue-950);
  --mb-color-primary-border: var(--mb-blue-400);
  --mb-color-secondary-solid: var(--mb-violet-400);
  --mb-color-secondary-solid-hover: var(--mb-violet-300);
  --mb-color-secondary-on-solid: var(--mb-gray-950);
  --mb-color-secondary-text: var(--mb-violet-300);
  --mb-color-secondary-subtle: var(--mb-violet-950);
  --mb-color-secondary-border: var(--mb-violet-400);
  --mb-color-tertiary-solid: var(--mb-teal-400);
  --mb-color-tertiary-solid-hover: var(--mb-teal-300);
  --mb-color-tertiary-on-solid: var(--mb-gray-950);
  --mb-color-tertiary-text: var(--mb-teal-300);
  --mb-color-tertiary-subtle: var(--mb-teal-950);
  --mb-color-tertiary-border: var(--mb-teal-400);
  --mb-color-danger-solid: var(--mb-red-400);
  --mb-color-danger-solid-hover: var(--mb-red-300);
  --mb-color-danger-on-solid: var(--mb-gray-950);
  --mb-color-danger-text: var(--mb-red-300);
  --mb-color-danger-subtle: var(--mb-red-950);
  --mb-color-danger-border: var(--mb-red-400);
  --mb-shadow-overlay: 0 8px 24px rgb(0 0 0 / 0.48);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    color-scheme: dark;
    --mb-color-bg-canvas: var(--mb-gray-950);
    --mb-color-bg-surface: var(--mb-gray-900);
    --mb-color-bg-surface-raised: var(--mb-gray-800);
    --mb-color-bg-disabled: var(--mb-gray-800);
    --mb-color-fg-default: var(--mb-gray-50);
    --mb-color-fg-muted: var(--mb-gray-300);
    --mb-color-fg-subtle: var(--mb-gray-400);
    --mb-color-fg-success: var(--mb-green-300);
    --mb-color-fg-disabled: var(--mb-gray-600);
    --mb-color-border-default: var(--mb-gray-700);
    --mb-color-border-strong: var(--mb-gray-500);
    --mb-color-border-focus: var(--mb-blue-400);
    --mb-color-neutral-solid: var(--mb-gray-800);
    --mb-color-neutral-solid-hover: var(--mb-gray-700);
    --mb-color-neutral-on-solid: var(--mb-gray-50);
    --mb-color-neutral-text: var(--mb-gray-50);
    --mb-color-neutral-subtle: var(--mb-gray-800);
    --mb-color-neutral-border: var(--mb-gray-500);
    --mb-color-primary-solid: var(--mb-blue-400);
    --mb-color-primary-solid-hover: var(--mb-blue-300);
    --mb-color-primary-on-solid: var(--mb-gray-950);
    --mb-color-primary-text: var(--mb-blue-300);
    --mb-color-primary-subtle: var(--mb-blue-950);
    --mb-color-primary-border: var(--mb-blue-400);
    --mb-color-secondary-solid: var(--mb-violet-400);
    --mb-color-secondary-solid-hover: var(--mb-violet-300);
    --mb-color-secondary-on-solid: var(--mb-gray-950);
    --mb-color-secondary-text: var(--mb-violet-300);
    --mb-color-secondary-subtle: var(--mb-violet-950);
    --mb-color-secondary-border: var(--mb-violet-400);
    --mb-color-tertiary-solid: var(--mb-teal-400);
    --mb-color-tertiary-solid-hover: var(--mb-teal-300);
    --mb-color-tertiary-on-solid: var(--mb-gray-950);
    --mb-color-tertiary-text: var(--mb-teal-300);
    --mb-color-tertiary-subtle: var(--mb-teal-950);
    --mb-color-tertiary-border: var(--mb-teal-400);
    --mb-color-danger-solid: var(--mb-red-400);
    --mb-color-danger-solid-hover: var(--mb-red-300);
    --mb-color-danger-on-solid: var(--mb-gray-950);
    --mb-color-danger-text: var(--mb-red-300);
    --mb-color-danger-subtle: var(--mb-red-950);
    --mb-color-danger-border: var(--mb-red-400);
    --mb-shadow-overlay: 0 8px 24px rgb(0 0 0 / 0.48);
  }
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx web-test-runner --files test/browser/tokens.test.ts`
Expected: 10 passed in each browser.

- [ ] **Step 5: Commit**

```bash
git add site/_includes/layout.njk src/tokens/tokens.css test/browser/tokens.test.ts
git commit -m "Replace accent and danger tokens with five color roles"
```

---

### Task 2: `ListboxState.setMultiple`

**Files:**
- `test/unit/state/listbox.test.ts`
- `src/core/state/listbox.ts`

**Interfaces:**
- Produces: `ListboxState.multiple` becomes a getter; `setMultiple(multiple: boolean): void` notifies only on change, and turning multiple off keeps the first selected key in option order. The DOM behavior already writes `aria-multiselectable` from `state.multiple` on every render.

- [ ] **Step 1: Write the failing tests**

`test/unit/state/listbox.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ListboxState, type ListboxItem, type Timers } from '../../../src/core/state/index.ts';

const fruit: ListboxItem[] = [
  { key: 'apple', label: 'Apple' },
  { key: 'banana', label: 'Banana' },
  { key: 'cherry', label: 'Cherry', disabled: true },
  { key: 'date', label: 'Date' },
  { key: 'blueberry', label: 'Blueberry' },
];

/** Timers that fire only when `flush()` is called. */
function fakeTimers(): Timers & { flush(): void; pending(): number } {
  const callbacks = new Map<number, () => void>();
  let next = 0;
  return {
    set(callback) {
      next += 1;
      callbacks.set(next, callback);
      return next;
    },
    clear(handle) {
      callbacks.delete(handle as number);
    },
    flush() {
      for (const callback of callbacks.values()) callback();
      callbacks.clear();
    },
    pending: () => callbacks.size,
  };
}

function listbox(options: { multiple?: boolean; items?: ListboxItem[] } = {}): ListboxState {
  const state = new ListboxState({ multiple: options.multiple ?? false, timers: fakeTimers() });
  state.setItems(options.items ?? fruit);
  return state;
}

describe('ListboxState navigation', () => {
  it('activates the first enabled option when items are set', () => {
    const state = listbox({ items: [{ key: 'x', label: 'X', disabled: true }, ...fruit] });
    expect(state.activeIndex).toBe(1);
  });

  it('has no active option when every option is disabled or there are none', () => {
    expect(listbox({ items: [] }).activeIndex).toBe(-1);
    const state = listbox({ items: [{ key: 'x', label: 'X', disabled: true }] });
    expect(state.activeIndex).toBe(-1);
    state.moveNext();
    state.moveLast();
    state.selectActive();
    expect(state.activeIndex).toBe(-1);
    expect(state.selected.size).toBe(0);
  });

  it('moveNext and movePrev skip disabled options and stop at the ends', () => {
    const state = listbox();
    state.moveNext();
    state.moveNext();
    expect(state.activeIndex).toBe(3);
    state.movePrev();
    expect(state.activeIndex).toBe(1);
    state.movePrev();
    state.movePrev();
    expect(state.activeIndex).toBe(0);
    state.moveLast();
    state.moveNext();
    expect(state.activeIndex).toBe(4);
  });

  it('moveFirst and moveLast skip disabled ends', () => {
    const items = [{ key: 'a', label: 'A', disabled: true }, { key: 'b', label: 'B' }, { key: 'c', label: 'C', disabled: true }];
    const state = listbox({ items });
    state.moveLast();
    expect(state.activeIndex).toBe(1);
    state.moveFirst();
    expect(state.activeIndex).toBe(1);
  });

  it('moveTo ignores disabled and out-of-range indices', () => {
    const state = listbox();
    state.moveTo(2);
    state.moveTo(99);
    state.moveTo(-1);
    expect(state.activeIndex).toBe(0);
    state.moveTo(3);
    expect(state.activeIndex).toBe(3);
  });

  it('notifies once per change and not at all for no-ops', () => {
    const state = listbox();
    let count = 0;
    state.subscribe(() => (count += 1));
    state.movePrev();
    state.moveFirst();
    state.moveNext();
    expect(count).toBe(1);
  });
});

describe('ListboxState selection', () => {
  it('single mode replaces the selection', () => {
    const state = listbox();
    state.selectActive();
    state.moveNext();
    state.selectActive();
    expect([...state.selected]).toEqual(['banana']);
    state.toggleActive();
    expect([...state.selected]).toEqual(['banana']);
  });

  it('multiple mode adds with selectActive and flips with toggleActive', () => {
    const state = listbox({ multiple: true });
    state.selectActive();
    state.moveNext();
    state.toggleActive();
    expect([...state.selected]).toEqual(['apple', 'banana']);
    state.toggleActive();
    expect([...state.selected]).toEqual(['apple']);
  });

  it('setSelected replaces the selection and keeps one key in single mode', () => {
    const single = listbox();
    single.setSelected(['date', 'apple']);
    expect([...single.selected]).toEqual(['date']);
    const multi = listbox({ multiple: true });
    multi.setSelected(['date', 'apple']);
    expect([...multi.selected]).toEqual(['date', 'apple']);
  });
});

describe('ListboxState setMultiple', () => {
  it('turning multiple off keeps the first selected option in option order', () => {
    const state = listbox({ multiple: true });
    state.setSelected(['date', 'banana']);
    state.setMultiple(false);
    expect(state.multiple).toBe(false);
    expect([...state.selected]).toEqual(['banana']);
  });

  it('turning multiple on lets selectActive add to the selection', () => {
    const state = listbox();
    state.selectActive();
    state.setMultiple(true);
    state.moveNext();
    state.selectActive();
    expect([...state.selected]).toEqual(['apple', 'banana']);
  });

  it('notifies only on change', () => {
    const state = listbox();
    let count = 0;
    state.subscribe(() => (count += 1));
    state.setMultiple(false);
    state.setMultiple(true);
    expect(count).toBe(1);
  });
});

describe('ListboxState setItems', () => {
  it('does nothing when the items are equal', () => {
    const state = listbox();
    let count = 0;
    state.subscribe(() => (count += 1));
    state.setItems(fruit.map((item) => ({ ...item })));
    expect(count).toBe(0);
  });

  it('keeps the active option by key when it moves', () => {
    const state = listbox();
    state.moveTo(3);
    state.setItems([fruit[3], fruit[0]]);
    expect(state.activeItem?.key).toBe('date');
    expect(state.activeIndex).toBe(0);
  });

  it('falls back to the option now at the old position, clamped to the end', () => {
    const state = listbox();
    state.moveTo(3);
    state.selectActive();
    state.moveTo(4);
    state.setItems(fruit.slice(0, 4));
    expect(state.activeItem?.key).toBe('date');
    state.setItems([{ key: 'kiwi', label: 'Kiwi' }]);
    expect(state.activeItem?.key).toBe('kiwi');
  });

  it('keeps selected keys while their options are filtered out', () => {
    const state = listbox({ multiple: true });
    state.setSelected(['apple', 'date']);
    state.setItems(fruit.slice(0, 2));
    state.setItems(fruit);
    expect([...state.selected]).toEqual(['apple', 'date']);
  });

  it('falls back to the nearest enabled option when the active one is removed', () => {
    const state = listbox();
    state.moveTo(3);
    state.setItems(fruit.filter((item) => item.key !== 'date'));
    expect(state.activeItem?.key).toBe('blueberry');
  });

  it('moves off an option that became disabled', () => {
    const state = listbox();
    state.moveTo(1);
    state.setItems(fruit.map((item) => (item.key === 'banana' ? { ...item, disabled: true } : item)));
    expect(state.activeItem?.key).toBe('date');
  });
});

describe('ListboxState typeahead', () => {
  it('matches label prefixes case-insensitively and skips disabled options', () => {
    const state = listbox();
    state.typeahead('C');
    expect(state.activeIndex).toBe(0);
    state.typeahead('d');
    expect(state.activeIndex).toBe(0);
  });

  it('builds a multi-character query until the timer fires', () => {
    const timers = fakeTimers();
    const state = new ListboxState({ timers });
    state.setItems(fruit);
    state.typeahead('b');
    state.typeahead('l');
    expect(state.activeItem?.key).toBe('blueberry');
    expect(state.typeaheadBuffer).toBe('bl');
    timers.flush();
    expect(state.typeaheadBuffer).toBe('');
    state.typeahead('d');
    expect(state.activeItem?.key).toBe('date');
  });

  it('cycles through options when the same character repeats', () => {
    const state = listbox();
    state.typeahead('b');
    expect(state.activeItem?.key).toBe('banana');
    state.typeahead('b');
    expect(state.activeItem?.key).toBe('blueberry');
    state.typeahead('b');
    expect(state.activeItem?.key).toBe('banana');
  });

  it('keeps one pending timer and resets it on each character', () => {
    const timers = fakeTimers();
    const state = new ListboxState({ timers });
    state.setItems(fruit);
    state.typeahead('a');
    state.typeahead('p');
    expect(timers.pending()).toBe(1);
  });

  it('includes spaces in the query', () => {
    const state = listbox({ items: [{ key: 'a', label: 'Red apple' }, { key: 'b', label: 'Red berry' }] });
    for (const char of 'red b') state.typeahead(char);
    expect(state.activeItem?.key).toBe('b');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run test/unit/state/listbox.test.ts`
Expected: FAIL: the three `setMultiple` tests fail with `state.setMultiple is not a function`.

- [ ] **Step 3: Implement**

`src/core/state/listbox.ts`:

```ts
import { Store } from './store.ts';

/** One option as the state sees it. */
export interface ListboxItem {
  /** Stable identity. Selection is stored by key. */
  readonly key: string;
  /** Text matched by typeahead. */
  readonly label: string;
  readonly disabled?: boolean;
}

/** The typeahead reset timer. Inject a fake in tests. */
export interface Timers {
  set(callback: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

export interface ListboxStateOptions {
  /** Allow more than one selected option. Defaults to false. */
  multiple?: boolean;
  /** Milliseconds of inactivity after which the typeahead buffer clears. Defaults to 500. */
  typeaheadTimeout?: number;
  timers?: Timers;
}

const defaultTimers: Timers = {
  set: (callback, ms) => setTimeout(callback, ms),
  clear: (handle) => {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
  },
};

function sameItems(a: readonly ListboxItem[], b: readonly ListboxItem[]): boolean {
  return (
    a.length === b.length &&
    a.every((item, index) => {
      const other = b[index];
      return (
        other !== undefined &&
        item.key === other.key &&
        item.label === other.label &&
        Boolean(item.disabled) === Boolean(other.disabled)
      );
    })
  );
}

/**
 * Active option, selection, and typeahead for a listbox.
 *
 * Navigation skips disabled options and does not wrap. `activeIndex` is -1
 * only when no option is enabled.
 */
export class ListboxState extends Store {
  #multiple: boolean;
  #items: readonly ListboxItem[] = [];
  #activeIndex = -1;
  #selected: ReadonlySet<string> = new Set();
  #buffer = '';
  #timer: unknown = undefined;
  readonly #timeout: number;
  readonly #timers: Timers;

  constructor(options: ListboxStateOptions = {}) {
    super();
    this.#multiple = options.multiple ?? false;
    this.#timeout = options.typeaheadTimeout ?? 500;
    this.#timers = options.timers ?? defaultTimers;
  }

  /** Whether more than one option can be selected. Change it with `setMultiple`. */
  get multiple(): boolean {
    return this.#multiple;
  }

  get items(): readonly ListboxItem[] {
    return this.#items;
  }

  get activeIndex(): number {
    return this.#activeIndex;
  }

  get activeItem(): ListboxItem | undefined {
    return this.#items[this.#activeIndex];
  }

  /** Keys of the selected options. May include keys whose options are currently absent. */
  get selected(): ReadonlySet<string> {
    return this.#selected;
  }

  /** Characters typed since the last typeahead reset. */
  get typeaheadBuffer(): string {
    return this.#buffer;
  }

  /**
   * Replaces the options. Keeps the active option if its key is still present
   * and enabled; otherwise activates the nearest enabled option at its old
   * position, so keyboard users keep their place. With no previous active
   * option, activates the first selected enabled option, then the first
   * enabled one. Selected keys are kept even when their options are absent,
   * so filtering never loses a selection. Does nothing when the new list
   * equals the current one.
   */
  setItems(items: readonly ListboxItem[]): void {
    if (sameItems(this.#items, items)) return;
    const previousIndex = this.#activeIndex;
    const activeKey = this.activeItem?.key;
    this.#items = [...items];
    const kept = items.findIndex((item) => item.key === activeKey && !item.disabled);
    if (kept !== -1) this.#activeIndex = kept;
    else if (previousIndex !== -1) this.#activeIndex = this.#nearestEnabled(previousIndex);
    else this.#activeIndex = this.#initialIndex();
    this.notify();
  }

  /**
   * Switches between single and multiple selection. Turning multiple off
   * keeps only the first selected key, in option order.
   */
  setMultiple(multiple: boolean): void {
    if (multiple === this.#multiple) return;
    this.#multiple = multiple;
    if (!multiple && this.#selected.size > 1) {
      const first =
        this.#items.find((item) => this.#selected.has(item.key))?.key ?? [...this.#selected][0];
      this.#selected = new Set(first === undefined ? [] : [first]);
    }
    this.notify();
  }

  /** Replaces the selection. In single mode only the first key is kept. */
  setSelected(keys: Iterable<string>): void {
    const next = [...keys].slice(0, this.multiple ? undefined : 1);
    if (next.length === this.#selected.size && next.every((key) => this.#selected.has(key))) return;
    this.#selected = new Set(next);
    this.notify();
  }

  moveNext(): void {
    this.#activate(this.#findEnabled(this.#activeIndex + 1, 1));
  }

  movePrev(): void {
    this.#activate(this.#findEnabled(this.#activeIndex - 1, -1));
  }

  moveFirst(): void {
    this.#activate(this.#findEnabled(0, 1));
  }

  moveLast(): void {
    this.#activate(this.#findEnabled(this.#items.length - 1, -1));
  }

  /** Activates the option at `index` if it exists and is enabled. */
  moveTo(index: number): void {
    const item = this.#items[index];
    if (item !== undefined && !item.disabled) this.#activate(index);
  }

  /** Single mode: selects only the active option. Multiple mode: adds it. */
  selectActive(): void {
    const item = this.activeItem;
    if (item === undefined || item.disabled) return;
    if (this.#selected.has(item.key) && (this.multiple || this.#selected.size === 1)) return;
    this.#selected = this.multiple ? new Set([...this.#selected, item.key]) : new Set([item.key]);
    this.notify();
  }

  /** Multiple mode: flips the active option. Single mode: same as `selectActive`. */
  toggleActive(): void {
    if (!this.multiple) {
      this.selectActive();
      return;
    }
    const item = this.activeItem;
    if (item === undefined || item.disabled) return;
    const next = new Set(this.#selected);
    if (next.has(item.key)) next.delete(item.key);
    else next.add(item.key);
    this.#selected = next;
    this.notify();
  }

  /**
   * Adds `char` to the buffer and activates the next enabled option whose
   * label starts with it. Repeating one character cycles through the options
   * starting with that character.
   */
  typeahead(char: string): void {
    if (this.#timer !== undefined) this.#timers.clear(this.#timer);
    this.#timer = this.#timers.set(() => {
      this.#buffer = '';
      this.#timer = undefined;
    }, this.#timeout);
    this.#buffer += char.toLowerCase();
    const first = this.#buffer.charAt(0);
    const repeated = [...this.#buffer].every((c) => c === first);
    const query = repeated ? first : this.#buffer;
    const start = repeated ? this.#activeIndex + 1 : this.#activeIndex;
    const count = this.#items.length;
    for (let offset = 0; offset < count; offset++) {
      const index = (((start + offset) % count) + count) % count;
      const item = this.#items[index];
      if (item !== undefined && !item.disabled && item.label.toLowerCase().startsWith(query)) {
        this.#activate(index);
        return;
      }
    }
  }

  #initialIndex(): number {
    const selected = this.#items.findIndex((item) => this.#selected.has(item.key) && !item.disabled);
    return selected !== -1 ? selected : this.#items.findIndex((item) => !item.disabled);
  }

  #nearestEnabled(index: number): number {
    const from = Math.min(index, this.#items.length - 1);
    const after = this.#findEnabled(from, 1);
    return after !== -1 ? after : this.#findEnabled(from, -1);
  }

  #findEnabled(from: number, step: 1 | -1): number {
    for (let index = from; index >= 0 && index < this.#items.length; index += step) {
      if (!this.#items[index]?.disabled) return index;
    }
    return -1;
  }

  #activate(index: number): void {
    if (index === -1 || index === this.#activeIndex) return;
    this.#activeIndex = index;
    this.notify();
  }
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: 33 unit tests pass, no type or lint errors.

- [ ] **Step 5: Commit**

```bash
git add src/core/state/listbox.ts test/unit/state/listbox.test.ts
git commit -m "Let ListboxState switch between single and multiple selection"
```

---

### Task 3: `AccordionState`

**Files:**
- `test/unit/state/accordion.test.ts`
- `src/core/state/accordion.ts`
- `src/core/state/index.ts`

**Interfaces:**
- Produces: `interface AccordionStateOptions { multiple?: boolean }`; `class AccordionState extends Store` with getters `multiple`, `items: readonly string[]`, `openKeys: ReadonlySet<string>`, method `isOpen(key)`, actions `setItems(keys)`, `setMultiple(multiple)`, `open(key)`, `close(key)`, `toggle(key)`.
- The spec names the actions `open`, `close`, `toggle`; the open-set getter is `openKeys` because a getter named `open` would clash with the `open()` action.

- [ ] **Step 1: Write the failing tests**

`test/unit/state/accordion.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { AccordionState } from '../../../src/core/state/index.ts';

function accordion(multiple = false): AccordionState {
  const state = new AccordionState({ multiple });
  state.setItems(['a', 'b', 'c']);
  return state;
}

describe('AccordionState', () => {
  it('single mode: opening an item closes the others', () => {
    const state = accordion();
    state.open('a');
    state.open('b');
    expect([...state.openKeys]).toEqual(['b']);
  });

  it('multiple mode: items open independently', () => {
    const state = accordion(true);
    state.open('a');
    state.open('c');
    expect([...state.openKeys]).toEqual(['a', 'c']);
    state.toggle('a');
    expect([...state.openKeys]).toEqual(['c']);
  });

  it('ignores unknown keys and notifies only on change', () => {
    const state = accordion();
    let count = 0;
    state.subscribe(() => (count += 1));
    state.open('zzz');
    state.close('a');
    state.open('a');
    state.open('a');
    expect(count).toBe(1);
    expect(state.isOpen('a')).toBe(true);
  });

  it('setItems drops open keys that are gone and ignores equal lists', () => {
    const state = accordion(true);
    state.open('a');
    state.open('b');
    let count = 0;
    state.subscribe(() => (count += 1));
    state.setItems(['a', 'b', 'c']);
    expect(count).toBe(0);
    state.setItems(['b', 'c']);
    expect([...state.openKeys]).toEqual(['b']);
  });

  it('turning multiple off keeps only the first open item in order', () => {
    const state = accordion(true);
    state.open('c');
    state.open('b');
    state.setMultiple(false);
    expect(state.multiple).toBe(false);
    expect([...state.openKeys]).toEqual(['b']);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run test/unit/state/accordion.test.ts`
Expected: FAIL: `AccordionState` is not exported (`AccordionState is not a constructor`).

- [ ] **Step 3: Implement**

`src/core/state/accordion.ts`:

```ts
import { Store } from './store.ts';

export interface AccordionStateOptions {
  /** Allow more than one open item. Defaults to false. */
  multiple?: boolean;
}

/**
 * Which items of an accordion are open. With `multiple` false, opening an
 * item closes the others.
 */
export class AccordionState extends Store {
  #multiple: boolean;
  #items: readonly string[] = [];
  #open: ReadonlySet<string> = new Set();

  constructor(options: AccordionStateOptions = {}) {
    super();
    this.#multiple = options.multiple ?? false;
  }

  get multiple(): boolean {
    return this.#multiple;
  }

  /** Item keys in order. */
  get items(): readonly string[] {
    return this.#items;
  }

  /** Keys of the open items. */
  get openKeys(): ReadonlySet<string> {
    return this.#open;
  }

  isOpen(key: string): boolean {
    return this.#open.has(key);
  }

  /**
   * Replaces the items. Drops open keys that are gone. In single mode, keeps
   * only the first open item. Does nothing when the keys are unchanged.
   */
  setItems(keys: readonly string[]): void {
    if (keys.length === this.#items.length && keys.every((key, index) => key === this.#items[index])) return;
    this.#items = [...keys];
    this.#setOpen(keys.filter((key) => this.#open.has(key)));
    this.notify();
  }

  /** Turning multiple off keeps only the first open item, in item order. */
  setMultiple(multiple: boolean): void {
    if (multiple === this.#multiple) return;
    this.#multiple = multiple;
    this.#setOpen(this.#items.filter((key) => this.#open.has(key)));
    this.notify();
  }

  open(key: string): void {
    if (!this.#items.includes(key) || this.#open.has(key)) return;
    this.#open = this.#multiple ? new Set([...this.#open, key]) : new Set([key]);
    this.notify();
  }

  close(key: string): void {
    if (!this.#open.has(key)) return;
    this.#open = new Set([...this.#open].filter((open) => open !== key));
    this.notify();
  }

  toggle(key: string): void {
    if (this.#open.has(key)) this.close(key);
    else this.open(key);
  }

  #setOpen(keys: readonly string[]): void {
    this.#open = new Set(this.#multiple ? keys : keys.slice(0, 1));
  }
}
```

`src/core/state/index.ts`:

```ts
export { Store, type Listener } from './store.ts';
export { DisclosureState, type DisclosureStateOptions } from './disclosure.ts';
export { DialogState } from './dialog.ts';
export { AccordionState, type AccordionStateOptions } from './accordion.ts';
export { ListboxState, type ListboxItem, type ListboxStateOptions, type Timers } from './listbox.ts';
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx vitest run && npm run typecheck && npm run lint`
Expected: 38 unit tests pass, no errors.

- [ ] **Step 5: Commit**

```bash
git add src/core/state/accordion.ts src/core/state/index.ts test/unit/state/accordion.test.ts
git commit -m "Add accordion state"
```

---

### Task 4: `attachAccordion` and the accordion conformance suite

**Files:**
- `src/core/testing/accordion.ts`
- `src/core/testing/index.ts`
- `test/skin/plain/accordion.ts`
- `test/browser/accordion.test.ts`
- `src/core/dom/accordion.ts`
- `src/core/dom/index.ts`

**Interfaces:**
- Consumes: `AccordionState` (Task 3), `DisclosureState`, `attachDisclosure`, `Behavior`, suite helpers from v1.
- Produces: `interface DisclosureLike { readonly state: DisclosureState }`; `interface AccordionElements { items: () => readonly DisclosureLike[] }`; `interface AttachAccordionOptions extends AccordionStateOptions { state?: AccordionState }`; `attachAccordion(elements, options?): Behavior<AccordionState>`. It writes no attributes. On attach, items already open count as open; in single mode the first one wins.
- Produces: `accordionConformance({ name, mount, driver, audit? })` with `AccordionMountSpec { multiple }` and `AccordionFixture { items: { trigger, panel }[] (exactly 3, collapsed, triggers inside headings); teardown() }`.

- [ ] **Step 1: Write the failing tests**

`src/core/testing/accordion.ts`:

```ts
import { expect } from 'chai';
import { deepActiveElement } from '../a11y/active-element.ts';
import { interactionTypes, nextFrame, type Audit, type Driver } from './driver.ts';

export interface AccordionItemFixture {
  trigger: HTMLElement;
  panel: HTMLElement;
}

export interface AccordionMountSpec {
  multiple: boolean;
}

export interface AccordionFixture {
  /** Exactly three items, all collapsed, each trigger inside a heading. */
  items: readonly AccordionItemFixture[];
  teardown(): void;
}

export interface AccordionSuiteOptions {
  name: string;
  /** Mounts an accordion with three collapsed items into `document.body`. */
  mount: (spec: AccordionMountSpec) => AccordionFixture | Promise<AccordionFixture>;
  driver: Driver;
  audit?: Audit;
}

function headingOf(trigger: HTMLElement): Element | null {
  return trigger.closest('h1, h2, h3, h4, h5, h6, [role="heading"]');
}

/** Registers the accordion conformance suite (WAI-ARIA APG accordion pattern). */
export function accordionConformance({ name, mount, driver, audit }: AccordionSuiteOptions): void {
  for (const multiple of [false, true]) {
    for (const interaction of interactionTypes) {
      const mode = multiple ? 'multiple' : 'single';
      describe(`${name}: accordion conformance (${mode}, ${interaction})`, () => {
        let fixture: AccordionFixture;

        beforeEach(async () => {
          fixture = await mount({ multiple });
          await nextFrame();
        });

        afterEach(() => {
          fixture.teardown();
        });

        const item = (index: number): AccordionItemFixture => {
          const found = fixture.items[index];
          if (found === undefined) throw new Error(`no item ${index}`);
          return found;
        };

        const activate = async (index: number): Promise<void> => {
          const { trigger } = item(index);
          if (interaction === 'keyboard') {
            trigger.focus();
            await driver.press('Enter');
          } else {
            await driver.click(trigger);
          }
          await nextFrame();
        };

        const expectOpen = (indices: number[]): void => {
          fixture.items.forEach(({ trigger, panel }, index) => {
            const open = indices.includes(index);
            expect(trigger.getAttribute('aria-expanded'), `aria-expanded on item ${index}`).to.equal(String(open));
            expect(panel.checkVisibility(), `panel ${index} visibility`).to.equal(open);
          });
        };

        it('exposes each trigger as a button in a heading that controls its panel', async () => {
          expect(fixture.items).to.have.length(3);
          for (const { trigger, panel } of fixture.items) {
            const isButton = trigger.localName === 'button' || trigger.getAttribute('role') === 'button';
            expect(isButton, 'trigger is a button').to.equal(true);
            expect(headingOf(trigger), 'trigger is inside a heading').not.to.equal(null);
            expect(trigger.ariaControlsElements?.[0]).to.equal(panel);
          }
          expectOpen([]);
          if (audit) await audit(item(0).trigger);
        });

        it('activating a collapsed item expands it, and activating it again collapses it', async () => {
          await activate(1);
          expectOpen([1]);
          if (audit) await audit(item(1).trigger);
          await activate(1);
          expectOpen([]);
        });

        if (multiple) {
          it('items open independently', async () => {
            await activate(0);
            await activate(2);
            expectOpen([0, 2]);
          });
        } else {
          it('expanding an item collapses the one that was open', async () => {
            await activate(0);
            await activate(2);
            expectOpen([2]);
          });
        }

        if (interaction === 'keyboard') {
          it('keeps focus on the activated trigger', async () => {
            await activate(0);
            await activate(1);
            expect(deepActiveElement()).to.equal(item(1).trigger);
          });
        }
      });
    }
  }
}
```

`src/core/testing/index.ts`:

```ts
export {
  accordionConformance,
  type AccordionFixture,
  type AccordionItemFixture,
  type AccordionMountSpec,
  type AccordionSuiteOptions,
} from './accordion.ts';
export { interactionTypes, nextFrame, type Audit, type Driver, type InteractionType } from './driver.ts';
export {
  disclosureConformance,
  type DisclosureFixture,
  type DisclosureSuiteOptions,
} from './disclosure.ts';
export { dialogConformance, type DialogFixture, type DialogSuiteOptions } from './dialog.ts';
export {
  listboxConformance,
  listboxSuiteOptions,
  type ListboxFixture,
  type ListboxMountSpec,
  type ListboxOptionSpec,
  type ListboxSuiteOptions,
} from './listbox.ts';
```

`test/skin/plain/accordion.ts`:

```ts
import { attachAccordion, attachDisclosure } from '../../../src/core/dom/index.ts';
import type { AccordionFixture, AccordionMountSpec } from '../../../src/core/testing/index.ts';

/** Minimal plain DOM accordion: three disclosures under h3 headings, coordinated by attachAccordion. */
export function mountPlainAccordion(spec: AccordionMountSpec): AccordionFixture {
  const container = document.createElement('div');
  container.innerHTML = ['Shipping', 'Returns', 'Warranty']
    .map((title) => `<h3><button type="button">${title}</button></h3><div hidden>${title} details</div>`)
    .join('');
  document.body.append(container);
  const triggers = [...container.querySelectorAll('button')];
  const disclosures = triggers.map((trigger) => {
    const panel = trigger.parentElement?.nextElementSibling as HTMLElement;
    const behavior = attachDisclosure({ trigger, panel });
    behavior.state.subscribe(() => {
      panel.hidden = !behavior.state.expanded;
    });
    return { trigger, panel, behavior };
  });
  const accordion = attachAccordion(
    { items: () => disclosures.map(({ behavior }) => behavior) },
    { multiple: spec.multiple },
  );
  return {
    items: disclosures.map(({ trigger, panel }) => ({ trigger, panel })),
    teardown() {
      accordion.dispose();
      for (const { behavior } of disclosures) behavior.dispose();
      container.remove();
    },
  };
}
```

`test/browser/accordion.test.ts`:

```ts
import { expect } from 'chai';
import { attachAccordion } from '../../src/core/dom/index.ts';
import { DisclosureState } from '../../src/core/state/index.ts';
import { accordionConformance } from '../../src/core/testing/index.ts';
import { mountPlainAccordion } from '../skin/plain/accordion.ts';
import { expectNoAxeViolations } from '../support/axe.ts';
import { driver } from '../support/driver.ts';

accordionConformance({ name: 'plain', mount: mountPlainAccordion, driver, audit: expectNoAxeViolations });

const items = (count: number, expanded: boolean[] = []): { state: DisclosureState }[] =>
  Array.from({ length: count }, (_, index) => ({ state: new DisclosureState({ expanded: expanded[index] ?? false }) }));

describe('attachAccordion', () => {
  it('keeps only the first initially open item in single mode', () => {
    const list = items(3, [false, true, true]);
    attachAccordion({ items: () => list });
    expect(list.map((item) => item.state.expanded)).to.deep.equal([false, true, false]);
  });

  it('keeps every initially open item in multiple mode', () => {
    const list = items(3, [true, false, true]);
    attachAccordion({ items: () => list }, { multiple: true });
    expect(list.map((item) => item.state.expanded)).to.deep.equal([true, false, true]);
  });

  it('sync picks up added items and stops coordinating removed ones', () => {
    let list = items(2);
    const behavior = attachAccordion({ items: () => list });
    const removed = list[0];
    const added = items(1)[0];
    list = [list[1], added];
    behavior.sync();
    added.state.open();
    removed.state.open();
    list[0]?.state.open();
    expect([removed.state.expanded, list[0]?.state.expanded, added.state.expanded]).to.deep.equal([true, true, false]);
  });

  it('setMultiple(false) collapses all but the first open item', () => {
    const list = items(3);
    const behavior = attachAccordion({ items: () => list }, { multiple: true });
    list[2]?.state.open();
    list[1]?.state.open();
    behavior.state.setMultiple(false);
    expect(list.map((item) => item.state.expanded)).to.deep.equal([false, true, false]);
  });

  it('dispose stops coordination', () => {
    const list = items(2);
    const behavior = attachAccordion({ items: () => list });
    behavior.dispose();
    list[0]?.state.open();
    list[1]?.state.open();
    expect(list.map((item) => item.state.expanded)).to.deep.equal([true, true]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx web-test-runner --files test/browser/accordion.test.ts`
Expected: FAIL: `attachAccordion` is not exported from `src/core/dom/index.ts`, so the test module cannot load.

- [ ] **Step 3: Implement**

`src/core/dom/accordion.ts`:

```ts
import { AccordionState, type AccordionStateOptions } from '../state/accordion.ts';
import type { DisclosureState } from '../state/disclosure.ts';
import type { Behavior } from './behavior.ts';

/** Anything that exposes a disclosure state: a disclosure `Behavior` or `DisclosureController`. */
export interface DisclosureLike {
  readonly state: DisclosureState;
}

export interface AccordionElements {
  /** The accordion's disclosures, in order. Read on attach and on every `sync()`. */
  items: () => readonly DisclosureLike[];
}

export interface AttachAccordionOptions extends AccordionStateOptions {
  /** Supply to share state. When given, `multiple` above is ignored. */
  state?: AccordionState;
}

/**
 * Accordion behavior: coordinates the disclosure states of its items so that,
 * in single mode, opening one closes the others.
 *
 * Writes no attributes. Each item's own disclosure behavior writes its ARIA.
 * On attach, items that are already open count as open; in single mode only
 * the first stays open.
 */
export function attachAccordion(
  elements: AccordionElements,
  options: AttachAccordionOptions = {},
): Behavior<AccordionState> {
  const state = options.state ?? new AccordionState(options);
  const keys = new WeakMap<DisclosureState, string>();
  let next = 0;
  let current: readonly DisclosureState[] = [];
  let unsubscribeItems: (() => void)[] = [];

  const keyOf = (item: DisclosureState): string => {
    let key = keys.get(item);
    if (key === undefined) {
      next += 1;
      key = String(next);
      keys.set(item, key);
    }
    return key;
  };

  // Push the accordion's open set down to each disclosure.
  const render = (): void => {
    for (const item of current) {
      const open = state.isOpen(keyOf(item));
      if (open && !item.expanded) item.open();
      else if (!open && item.expanded) item.close();
    }
  };

  const sync = (): void => {
    for (const unsubscribe of unsubscribeItems) unsubscribe();
    const previous = new Set(current);
    current = items();
    // Newly seen items that are already open join the open set.
    const newlyOpen = current.filter((item) => !previous.has(item) && item.expanded).map(keyOf);
    state.setItems(current.map(keyOf));
    for (const key of newlyOpen) {
      // In single mode the first open item wins, including one already open before.
      if (!state.multiple && state.openKeys.size > 0) break;
      state.open(key);
    }
    // Pull each disclosure's own changes (user clicks) up into the accordion.
    unsubscribeItems = current.map((item) =>
      item.subscribe(() => {
        if (item.expanded) state.open(keyOf(item));
        else state.close(keyOf(item));
      }),
    );
    render();
  };

  const items = (): readonly DisclosureState[] => elements.items().map((item) => item.state);
  const unsubscribe = state.subscribe(render);
  sync();

  return {
    state,
    sync,
    dispose() {
      unsubscribe();
      for (const unsubscribeItem of unsubscribeItems) unsubscribeItem();
      unsubscribeItems = [];
    },
  };
}
```

`src/core/dom/index.ts`:

```ts
export {
  AttributeWriter,
  type AriaReferenceProperty,
  type Attributes,
  type References,
} from './attribute-writer.ts';
export type { Behavior } from './behavior.ts';
export { attachDisclosure, type AttachDisclosureOptions, type DisclosureElements } from './disclosure.ts';
export { attachDialog, type AttachDialogOptions, type DialogElements } from './dialog.ts';
export {
  attachAccordion,
  type AccordionElements,
  type AttachAccordionOptions,
  type DisclosureLike,
} from './accordion.ts';
export {
  attachListbox,
  describeOption,
  type AttachListboxOptions,
  type ListboxElements,
  type ListboxFocusStrategy,
} from './listbox.ts';
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx web-test-runner --files test/browser/accordion.test.ts && npm run typecheck && npm run lint`
Expected: 19 passed in each browser (14 conformance tests across single, multiple, keyboard, pointer, plus 5 behavior tests).

- [ ] **Step 5: Check that the tests can fail**

Temporarily delete this line from `src/core/dom/accordion.ts`:

```ts
      if (!state.multiple && state.openKeys.size > 0) break;
```

Rerun the previous step's command. Expected: "keeps only the first initially open item in single mode" fails ([false, false, true]). Revert the change and rerun to green.

- [ ] **Step 6: Commit**

```bash
git add src/core/dom/accordion.ts src/core/dom/index.ts src/core/testing/accordion.ts src/core/testing/index.ts test/browser/accordion.test.ts test/skin/plain/accordion.ts
git commit -m "Add accordion behavior and conformance suite"
```

---

### Task 5: Components foundation and `mb-button`

**Files:**
- `test/support/components.ts`
- `test/browser/components/button.test.ts`
- `src/components/shared/color.ts`
- `src/components/shared/styles.ts`
- `src/components/shared/define.ts`
- `src/components/button/button.styles.ts`
- `src/components/button/button.ts`
- `src/components/define/button.ts`
- `src/components/define/all.ts`
- `src/components/index.ts`
- `package.json`
- `package-lock.json`

**Interfaces:**
- Consumes: `DelegatesFocus` (v1).
- Produces: `colorRoles`, `type ColorRole`, `colorRole(value): ColorRole` (unknown values become `neutral`); `hostStyles`, `focusRing`, `colorRoleStyles` (a `.color-<role>` class sets private `--_solid`, `--_solid-hover`, `--_on-solid`, `--_text`, `--_subtle`, `--_border`, which inherit into children and slotted content); `define(tag, constructor)` (skips registered tags).
- Produces: `class MbButton` (`variant: 'default' | 'outline' | 'ghost'`, `color: ColorRole`, `type: 'button' | 'submit' | 'reset'`, `disabled`, read-only `form`), registered by `match-box/components/define/button.js`.
- Test helpers: `mount<T>(markup)` → `{ element, container }`, `settle(root)`, `part(host, name)`, `resolveColor(token)`, `loadTokens()`.
- `variant` and `color` are not reflected, so hosts carry no attributes they were not given; styles key off classes on the inner element.

- [ ] **Step 1: Write the failing tests**

`test/support/components.ts`:

```ts
import type { LitElement } from 'lit';

/** Waits until every Lit element under `root` (including shadow roots) has finished updating. */
export async function settle(root: ParentNode): Promise<void> {
  for (let pass = 0; pass < 3; pass++) {
    const elements = [...root.querySelectorAll('*')].filter(
      (element): element is LitElement => 'updateComplete' in element,
    );
    await Promise.all(elements.map((element) => element.updateComplete));
    for (const element of elements) if (element.shadowRoot) await settle(element.shadowRoot);
  }
}

/** Appends `markup` in a container at the end of `document.body` and waits for it to render. */
export async function mount<T extends Element>(markup: string): Promise<{ element: T; container: HTMLElement }> {
  const container = document.createElement('div');
  container.innerHTML = markup;
  document.body.append(container);
  await settle(container);
  const element = container.firstElementChild;
  if (element === null) throw new Error('nothing mounted');
  return { element: element as T, container };
}

/** The element's shadow part, or an error. */
export function part<T extends Element = HTMLElement>(host: Element, name: string): T {
  const found = host.shadowRoot?.querySelector<T & Element>(`[part~='${name}']`);
  if (!found) throw new Error(`no part ${name}`);
  return found;
}

/** The computed `rgb()` color of a custom property, resolved on a probe element. */
export function resolveColor(token: string, within: Element = document.body): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  within.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** Loads src/tokens/tokens.css once. */
export async function loadTokens(): Promise<void> {
  if (document.querySelector('link[data-tokens]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('../../src/tokens/tokens.css', import.meta.url).href;
  link.dataset['tokens'] = '';
  const loaded = new Promise((resolve) => link.addEventListener('load', resolve));
  document.head.append(link);
  await loaded;
}
```

`test/browser/components/button.test.ts`:

```ts
import { expect } from 'chai';
import '../../../src/components/define/button.ts';
import type { MbButton } from '../../../src/components/index.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

async function formWith(markup: string): Promise<{ form: HTMLFormElement; button: MbButton; submits: number[] }> {
  const { element: form } = await mount<HTMLFormElement>(`<form><input name="city" value="Oslo">${markup}</form>`);
  const submits: number[] = [];
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submits.push(1);
  });
  return { form, button: form.querySelector('mb-button') as MbButton, submits };
}

describe('mb-button', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders a native button with the label, hiding empty prefix and suffix', async () => {
    const { element } = await mount<MbButton>('<mb-button>Save</mb-button>');
    expect(part(element, 'base').localName).to.equal('button');
    expect(part(element, 'prefix').hidden).to.equal(true);
    expect(part(element, 'suffix').hidden).to.equal(true);
  });

  it('shows the prefix wrapper when something is slotted into it', async () => {
    const { element } = await mount<MbButton>('<mb-button><span slot="prefix">+</span>Add</mb-button>');
    expect(part(element, 'prefix').hidden).to.equal(false);
  });

  it('type="submit" submits its form, and the default type does not', async () => {
    const { button, submits } = await formWith('<mb-button>Plain</mb-button><mb-button type="submit">Send</mb-button>');
    await driver.click(part(button, 'base'));
    expect(submits).to.have.length(0);
    await driver.click(part(document.querySelector('mb-button[type=submit]') as MbButton, 'base'));
    expect(submits).to.have.length(1);
  });

  it('type="reset" resets its form', async () => {
    const { form, button } = await formWith('<mb-button type="reset">Reset</mb-button>');
    (form.elements.namedItem('city') as HTMLInputElement).value = 'Rome';
    await driver.click(part(button, 'base'));
    expect((form.elements.namedItem('city') as HTMLInputElement).value).to.equal('Oslo');
  });

  it('disabled disables the native button and does not submit', async () => {
    const { button, submits } = await formWith('<mb-button type="submit" disabled>Send</mb-button>');
    expect(part<HTMLButtonElement>(button, 'base').disabled).to.equal(true);
    await driver.click(part(button, 'base'));
    expect(submits).to.have.length(0);
  });

  it('a disabled fieldset disables it', async () => {
    const { element: form } = await mount<HTMLFormElement>(
      '<form><fieldset disabled><mb-button type="submit">Send</mb-button></fieldset></form>',
    );
    const button = form.querySelector('mb-button') as MbButton;
    await settle(form);
    expect(part<HTMLButtonElement>(button, 'base').disabled).to.equal(true);
    (form.querySelector('fieldset') as HTMLFieldSetElement).disabled = false;
    await settle(form);
    expect(part<HTMLButtonElement>(button, 'base').disabled).to.equal(false);
  });

  it('focusing the host focuses the native button', async () => {
    const { element } = await mount<MbButton>('<mb-button>Save</mb-button>');
    element.focus();
    expect(element.shadowRoot?.activeElement).to.equal(part(element, 'base'));
  });

  it('keeps reflected attributes off the host unless set', async () => {
    const { element } = await mount<MbButton>('<mb-button>Save</mb-button>');
    expect(element.getAttributeNames()).to.deep.equal([]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx web-test-runner --files test/browser/components/button.test.ts`
Expected: FAIL: `src/components/define/button.ts` cannot be loaded.

- [ ] **Step 3: Implement**

Add the component exports and the `sideEffects` rule to `package.json`:

```bash
node -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
p.sideEffects = ["**/*.css", "./dist/components/define/*.js"];
const { ["./tokens.css"]: tokens, ...rest } = p.exports;
p.exports = {
  ...rest,
  "./components": { types: "./dist/components/index.d.ts", default: "./dist/components/index.js" },
  "./components/define/*.js": { types: "./dist/components/define/*.d.ts", default: "./dist/components/define/*.js" },
  "./tokens.css": tokens,
};
fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");'
```

`src/components/shared/color.ts`:

```ts
/** The five color roles. Every role is six semantic tokens in tokens.css. */
export const colorRoles = ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] as const;

export type ColorRole = (typeof colorRoles)[number];

/** Returns `value` if it is a color role, otherwise `neutral`. */
export function colorRole(value: string | null | undefined): ColorRole {
  return colorRoles.find((role) => role === value) ?? 'neutral';
}
```

`src/components/shared/styles.ts`:

```ts
import { css, unsafeCSS, type CSSResult } from 'lit';
import { colorRoles } from './color.ts';

/** Box sizing and `hidden` support for every component. */
export const hostStyles = css`
  :host {
    box-sizing: border-box;
  }

  :host([hidden]) {
    display: none !important;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  [hidden] {
    display: none !important;
  }
`;

/** The focus ring every focusable part shows. */
export const focusRing = css`
  outline: var(--mb-focus-ring-width) solid var(--mb-color-border-focus);
  outline-offset: 2px;
`;

/**
 * Maps a `.color-<role>` class to private `--_solid`, `--_solid-hover`,
 * `--_on-solid`, `--_text`, `--_subtle`, and `--_border` properties, which
 * inherit to children and slotted content. Components always render an
 * explicit class, `color-neutral` included.
 */
export const colorRoleStyles: CSSResult = unsafeCSS(
  colorRoles
    .map((role) => {
      return `.color-${role} {
  --_solid: var(--mb-color-${role}-solid);
  --_solid-hover: var(--mb-color-${role}-solid-hover);
  --_on-solid: var(--mb-color-${role}-on-solid);
  --_text: var(--mb-color-${role}-text);
  --_subtle: var(--mb-color-${role}-subtle);
  --_border: var(--mb-color-${role}-border);
}`;
    })
    .join('\n'),
);
```

`src/components/shared/define.ts`:

```ts
/** Registers `constructor` as `tag` unless the tag is already registered. */
export function define(tag: string, constructor: CustomElementConstructor): void {
  if (!customElements.get(tag)) customElements.define(tag, constructor);
}
```

`src/components/button/button.styles.ts`:

```ts
import { css } from 'lit';
import { colorRoleStyles, focusRing, hostStyles } from '../shared/styles.ts';

export const buttonStyles = [
  hostStyles,
  colorRoleStyles,
  css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    [part='base'] {
      display: inline-flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      gap: var(--mb-button-gap, var(--mb-space-inline-sm));
      min-block-size: var(--mb-button-height, 2.25rem);
      margin: 0;
      padding-block: 0;
      padding-inline: var(--mb-button-padding-inline, var(--mb-space-inline-md));
      border: var(--mb-button-border-width, 1px) solid var(--mb-button-border-color, transparent);
      border-radius: var(--mb-button-radius, var(--mb-radius-control));
      font-family: var(--mb-button-font-family, var(--mb-font-family-body));
      font-size: var(--mb-button-font-size, var(--mb-font-size-body));
      font-weight: var(--mb-button-font-weight, var(--mb-font-weight-strong));
      line-height: 1.25;
      cursor: pointer;
      background: var(--mb-button-bg, var(--_solid));
      color: var(--mb-button-fg, var(--_on-solid));
    }

    [part='base']:hover:not(:disabled) {
      background: var(--mb-button-bg-hover, var(--_solid-hover));
    }

    [part='base'].variant-outline {
      background: var(--mb-button-bg, transparent);
      color: var(--mb-button-fg, var(--_text));
      border-color: var(--mb-button-border-color, var(--_border));
    }

    [part='base'].variant-ghost {
      background: var(--mb-button-bg, transparent);
      color: var(--mb-button-fg, var(--_text));
    }

    [part='base'].variant-outline:hover:not(:disabled),
    [part='base'].variant-ghost:hover:not(:disabled) {
      background: var(--mb-button-bg-hover, var(--_subtle));
    }

    [part='base']:disabled {
      cursor: not-allowed;
      background: var(--mb-color-bg-disabled);
      color: var(--mb-color-fg-disabled);
      border-color: transparent;
    }

    [part='base'].variant-ghost:disabled {
      background: transparent;
    }

    [part='base']:focus-visible {
      ${focusRing}
    }

    [part='prefix'],
    [part='suffix'] {
      display: inline-flex;
    }

    @media (forced-colors: active) {
      [part='base'] {
        border-color: ButtonText;
      }

      [part='base']:disabled {
        color: GrayText;
        border-color: GrayText;
      }
    }
  `,
];
```

`src/components/button/button.ts`:

```ts
import { LitElement, html } from 'lit';
import { DelegatesFocus } from '../../lit/delegates-focus.ts';
import { colorRole, type ColorRole } from '../shared/color.ts';
import { buttonStyles } from './button.styles.ts';

export type ButtonVariant = 'default' | 'outline' | 'ghost';
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * A button.
 *
 * @tag mb-button
 * @slot - The label.
 * @slot prefix - Content before the label, such as an icon.
 * @slot suffix - Content after the label.
 * @csspart base - The native button.
 * @csspart label - The label wrapper.
 * @csspart prefix - The prefix wrapper.
 * @csspart suffix - The suffix wrapper.
 * @cssprop --mb-button-bg - Background.
 * @cssprop --mb-button-bg-hover - Background on hover.
 * @cssprop --mb-button-fg - Text color.
 * @cssprop --mb-button-border-color - Border color.
 * @cssprop --mb-button-border-width - Border width.
 * @cssprop --mb-button-radius - Corner radius.
 * @cssprop --mb-button-height - Minimum height.
 * @cssprop --mb-button-padding-inline - Horizontal padding.
 * @cssprop --mb-button-gap - Space between prefix, label, and suffix.
 * @cssprop --mb-button-font-family - Font family.
 * @cssprop --mb-button-font-size - Font size.
 * @cssprop --mb-button-font-weight - Font weight.
 */
export class MbButton extends DelegatesFocus(LitElement) {
  static formAssociated = true;
  static override styles = buttonStyles;
  static override properties = {
    variant: {},
    color: {},
    type: {},
    disabled: { type: Boolean, reflect: true },
  };

  /** The structure: filled, outlined, or background-free until hover. Unknown values render as `default`. */
  declare variant: ButtonVariant;
  /** The color role. */
  declare color: ColorRole;
  /** What the button does in a form. */
  declare type: ButtonType;
  declare disabled: boolean;

  readonly #internals: ElementInternals;
  #formDisabled = false;
  #hasPrefix = false;
  #hasSuffix = false;

  constructor() {
    super();
    this.variant = 'default';
    this.color = 'neutral';
    this.type = 'button';
    this.disabled = false;
    this.#internals = this.attachInternals();
  }

  /** The form this button submits or resets, if any. */
  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  /** Called by the platform when a `<fieldset>` ancestor is disabled or enabled. */
  formDisabledCallback(disabled: boolean): void {
    this.#formDisabled = disabled;
    this.requestUpdate();
  }

  override render() {
    const disabled = this.disabled || this.#formDisabled;
    return html`<button
      part="base"
      class="variant-${this.variant} color-${colorRole(this.color)}"
      type="button"
      ?disabled=${disabled}
      @click=${this.#onClick}
    >
      <span part="prefix" ?hidden=${!this.#hasPrefix}
        ><slot name="prefix" @slotchange=${this.#onPrefixChange}></slot
      ></span>
      <span part="label"><slot></slot></span>
      <span part="suffix" ?hidden=${!this.#hasSuffix}
        ><slot name="suffix" @slotchange=${this.#onSuffixChange}></slot
      ></span>
    </button>`;
  }

  #onPrefixChange(event: Event): void {
    this.#hasPrefix = hasContent(event);
    this.requestUpdate();
  }

  #onSuffixChange(event: Event): void {
    this.#hasSuffix = hasContent(event);
    this.requestUpdate();
  }

  #onClick(): void {
    if (this.type === 'submit') this.#internals.form?.requestSubmit();
    else if (this.type === 'reset') this.#internals.form?.reset();
  }
}

function hasContent(event: Event): boolean {
  return (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
}
```

`src/components/define/button.ts`:

```ts
import { MbButton } from '../button/button.ts';
import { define } from '../shared/define.ts';

define('mb-button', MbButton);

declare global {
  interface HTMLElementTagNameMap {
    'mb-button': MbButton;
  }
}
```

`src/components/define/all.ts`:

```ts
import './button.ts';
```

`src/components/index.ts`:

```ts
export { MbButton, type ButtonType, type ButtonVariant } from './button/button.ts';
export { colorRoles, type ColorRole } from './shared/color.ts';
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx web-test-runner --files test/browser/components/button.test.ts && npm run typecheck && npm run lint`
Expected: 8 passed in each browser.

- [ ] **Step 5: Commit**

```bash
git add package-lock.json package.json src/components/button/button.styles.ts src/components/button/button.ts src/components/define/all.ts src/components/define/button.ts src/components/index.ts src/components/shared/color.ts src/components/shared/define.ts src/components/shared/styles.ts test/browser/components/button.test.ts test/support/components.ts
git commit -m "Add component foundations and mb-button"
```

---

### Task 6: `mb-disclosure`

**Files:**
- `test/browser/components/disclosure.test.ts`
- `test/browser/components/conformance.test.ts`
- `src/components/disclosure/disclosure.styles.ts`
- `src/components/disclosure/disclosure.ts`
- `src/components/define/disclosure.ts`
- `src/components/define/all.ts`
- `src/components/index.ts`

**Interfaces:**
- Consumes: `DisclosureController` (v1), shared styles (Task 5).
- Produces: `class MbDisclosure` with `open` (reflected; a synchronous accessor over the controller state), `color`, `headingLevel` (`heading-level`), `readonly disclosure: DisclosureController`, custom state `open`, and a `toggle` `ToggleEvent` on every change.
- `open` applies to the state immediately rather than in `willUpdate`, so an accordion attaching in the same task sees disclosures that start open.

- [ ] **Step 1: Write the failing tests**

`test/browser/components/disclosure.test.ts`:

```ts
import { expect } from 'chai';
import '../../../src/components/define/disclosure.ts';
import type { MbDisclosure } from '../../../src/components/index.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const markup = '<mb-disclosure><span slot="summary">Details</span>Content</mb-disclosure>';

describe('mb-disclosure', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reflects open, sets :state(open), and fires toggle when the user opens it', async () => {
    const { element } = await mount<MbDisclosure>(markup);
    const events: string[] = [];
    element.addEventListener('toggle', (event) => events.push(`${event.oldState}>${event.newState}`));
    await driver.click(part(element, 'trigger'));
    await settle(document.body);
    expect(element.hasAttribute('open')).to.equal(true);
    expect(element.matches(':state(open)')).to.equal(true);
    expect(events).to.deep.equal(['closed>open']);
  });

  it('opens and closes from the open property, firing toggle once per change', async () => {
    const { element } = await mount<MbDisclosure>(markup);
    const events: string[] = [];
    element.addEventListener('toggle', (event) => events.push(event.newState));
    element.open = true;
    await settle(document.body);
    element.open = true;
    await settle(document.body);
    expect(part(element, 'panel').hidden).to.equal(false);
    element.open = false;
    await settle(document.body);
    expect(part(element, 'panel').hidden).to.equal(true);
    expect(events).to.deep.equal(['open', 'closed']);
  });

  it('starts open with the open attribute', async () => {
    const { element } = await mount<MbDisclosure>('<mb-disclosure open><span slot="summary">D</span>C</mb-disclosure>');
    expect(part(element, 'trigger').getAttribute('aria-expanded')).to.equal('true');
    expect(part(element, 'panel').checkVisibility()).to.equal(true);
  });

  it('heading-level wraps the trigger in a heading, and the controller follows the new trigger', async () => {
    const { element } = await mount<MbDisclosure>(markup);
    element.headingLevel = 2;
    await settle(document.body);
    const heading = part(element, 'heading');
    expect([heading.getAttribute('role'), heading.getAttribute('aria-level')]).to.deep.equal(['heading', '2']);
    await driver.click(part(element, 'trigger'));
    expect(part(element, 'trigger').getAttribute('aria-expanded')).to.equal('true');
  });
});
```

`test/browser/components/conformance.test.ts`:

```ts
import '../../../src/components/define/all.ts';
import type { MbDisclosure } from '../../../src/components/index.ts';
import { disclosureConformance } from '../../../src/core/testing/index.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const audit = expectNoAxeViolations;

before(loadTokens);

disclosureConformance({
  name: 'mb-disclosure',
  driver,
  audit,
  async mount() {
    const { element, container } = await mount<MbDisclosure>(
      '<mb-disclosure><span slot="summary">Shipping details</span>Ships in two days.</mb-disclosure>',
    );
    return { trigger: part(element, 'trigger'), panel: part(element, 'panel'), teardown: () => container.remove() };
  },
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx web-test-runner --files test/browser/components/disclosure.test.ts test/browser/components/conformance.test.ts`
Expected: FAIL: `src/components/define/disclosure.ts` cannot be loaded, and `MbDisclosure` is not exported.

- [ ] **Step 3: Implement**

`src/components/disclosure/disclosure.styles.ts`:

```ts
import { css } from 'lit';
import { colorRoleStyles, focusRing, hostStyles } from '../shared/styles.ts';

export const disclosureStyles = [
  hostStyles,
  colorRoleStyles,
  css`
    :host {
      display: block;
      border-block-end: 1px solid var(--mb-disclosure-border-color, var(--mb-color-border-default));
    }

    [part='heading'] {
      margin: 0;
    }

    [part='trigger'] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--mb-space-inline-md);
      inline-size: 100%;
      margin: 0;
      padding-block: var(--mb-disclosure-padding-block, var(--mb-space-stack-md));
      padding-inline: var(--mb-disclosure-padding-inline, var(--mb-space-inline-sm));
      border: 0;
      background: var(--mb-disclosure-trigger-bg, transparent);
      color: var(--mb-disclosure-trigger-fg, var(--_text));
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-font-size-body);
      font-weight: var(--mb-disclosure-font-weight, var(--mb-font-weight-strong));
      text-align: start;
      cursor: pointer;
    }

    [part='trigger']:hover {
      background: var(--mb-disclosure-trigger-bg-hover, var(--_subtle));
    }

    [part='trigger']:focus-visible {
      ${focusRing}
    }

    [part='icon'] {
      flex: none;
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-inline-end: 2px solid currentColor;
      border-block-end: 2px solid currentColor;
      transform: translateY(-25%) rotate(45deg);
    }

    :host(:state(open)) [part='icon'] {
      transform: translateY(25%) rotate(-135deg);
    }

    [part='panel'] {
      padding-block: var(--mb-disclosure-panel-padding-block, var(--mb-space-stack-md));
      padding-inline: var(--mb-disclosure-padding-inline, var(--mb-space-inline-sm));
      color: var(--mb-color-fg-default);
    }

    @media (forced-colors: active) {
      :host {
        border-block-end-color: CanvasText;
      }

      [part='trigger'] {
        color: ButtonText;
      }
    }
  `,
];
```

`src/components/disclosure/disclosure.ts`:

```ts
import { LitElement, html } from 'lit';
import { DisclosureController } from '../../lit/controllers.ts';
import { colorRole, type ColorRole } from '../shared/color.ts';
import { disclosureStyles } from './disclosure.styles.ts';

/**
 * A button that shows and hides a panel.
 *
 * @tag mb-disclosure
 * @slot summary - The trigger text.
 * @slot - The panel content.
 * @csspart heading - The heading wrapper, present when `heading-level` is set.
 * @csspart trigger - The button.
 * @csspart summary - The trigger text wrapper.
 * @csspart icon - The chevron.
 * @csspart panel - The panel.
 * @cssstate open - The panel is shown.
 * @cssprop --mb-disclosure-border-color - Divider below the disclosure.
 * @cssprop --mb-disclosure-trigger-bg - Trigger background.
 * @cssprop --mb-disclosure-trigger-bg-hover - Trigger background on hover.
 * @cssprop --mb-disclosure-trigger-fg - Trigger text color.
 * @cssprop --mb-disclosure-font-weight - Trigger font weight.
 * @cssprop --mb-disclosure-padding-block - Trigger vertical padding.
 * @cssprop --mb-disclosure-padding-inline - Trigger and panel horizontal padding.
 * @cssprop --mb-disclosure-panel-padding-block - Panel vertical padding.
 * @fires toggle - After the panel opens or closes, by the user or in code. A `ToggleEvent` with `newState` and `oldState`.
 */
export class MbDisclosure extends LitElement {
  static override styles = disclosureStyles;
  static override properties = {
    open: { type: Boolean, reflect: true, noAccessor: true },
    color: {},
    headingLevel: { type: Number, attribute: 'heading-level' },
  };

  declare color: ColorRole;
  /** Wraps the trigger in a heading of this level (1 to 6). Required inside an accordion. */
  declare headingLevel: number | undefined;

  /** The underlying controller; `mb-accordion` coordinates its state. */
  readonly disclosure = new DisclosureController(this, () => ({
    trigger: this.renderRoot.querySelector<HTMLElement>('[part=trigger]'),
    panel: this.renderRoot.querySelector<HTMLElement>('[part=panel]'),
  }));

  readonly #internals: ElementInternals;

  constructor() {
    super();
    this.color = 'neutral';
    this.headingLevel = undefined;
    this.#internals = this.attachInternals();
    this.disclosure.state.subscribe(() => {
      const { expanded } = this.disclosure.state;
      this.requestUpdate('open', !expanded);
      if (expanded) this.#internals.states.add('open');
      else this.#internals.states.delete('open');
      this.dispatchEvent(
        new ToggleEvent('toggle', {
          newState: expanded ? 'open' : 'closed',
          oldState: expanded ? 'closed' : 'open',
        }),
      );
    });
  }

  /** Whether the panel is shown. Applies to the state immediately, so an accordion sees it at once. */
  get open(): boolean {
    return this.disclosure.state.expanded;
  }

  set open(open: boolean) {
    if (open) this.disclosure.state.open();
    else this.disclosure.state.close();
  }

  override render() {
    const trigger = html`<button part="trigger" class="color-${colorRole(this.color)}" type="button">
      <span part="summary"><slot name="summary"></slot></span>
      <span part="icon"></span>
    </button>`;
    const level = this.headingLevel;
    return html`${level !== undefined && level >= 1 && level <= 6
        ? html`<div part="heading" role="heading" aria-level=${level}>${trigger}</div>`
        : trigger}
      <div part="panel" ?hidden=${!this.disclosure.state.expanded}><slot></slot></div>`;
  }
}
```

`src/components/define/disclosure.ts`:

```ts
import { MbDisclosure } from '../disclosure/disclosure.ts';
import { define } from '../shared/define.ts';

define('mb-disclosure', MbDisclosure);

declare global {
  interface HTMLElementTagNameMap {
    'mb-disclosure': MbDisclosure;
  }
}
```

`src/components/define/all.ts`:

```ts
import './button.ts';
import './disclosure.ts';
```

`src/components/index.ts`:

```ts
export { MbButton, type ButtonType, type ButtonVariant } from './button/button.ts';
export { MbDisclosure } from './disclosure/disclosure.ts';
export { colorRoles, type ColorRole } from './shared/color.ts';
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx web-test-runner --files test/browser/components/disclosure.test.ts test/browser/components/conformance.test.ts && npm run typecheck && npm run lint`
Expected: 10 passed in each browser (4 component tests, 6 conformance tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/define/all.ts src/components/define/disclosure.ts src/components/disclosure/disclosure.styles.ts src/components/disclosure/disclosure.ts src/components/index.ts test/browser/components/conformance.test.ts test/browser/components/disclosure.test.ts
git commit -m "Add mb-disclosure"
```

---

### Task 7: `mb-accordion` and `AccordionController`

**Files:**
- `test/browser/components/accordion.test.ts`
- `test/browser/components/conformance.test.ts`
- `src/lit/controllers.ts`
- `src/lit/index.ts`
- `src/components/accordion/accordion.styles.ts`
- `src/components/accordion/accordion.ts`
- `src/components/define/accordion.ts`
- `src/components/define/all.ts`
- `src/components/index.ts`

**Interfaces:**
- Consumes: `attachAccordion` (Task 4), `MbDisclosure` (Task 6).
- Produces: `class AccordionController` (`new AccordionController(host, () => Pending<AccordionElements>, options?)`, required element `items`); `class MbAccordion` with `multiple` (reflected) and `headingLevel` (default 3, applied to child disclosures without their own `heading-level` attribute).

- [ ] **Step 1: Write the failing tests**

`test/browser/components/accordion.test.ts`:

```ts
import { expect } from 'chai';
import '../../../src/components/define/accordion.ts';
import type { MbAccordion, MbDisclosure } from '../../../src/components/index.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';

const item = (title: string, attributes = ''): string =>
  `<mb-disclosure ${attributes}><span slot="summary">${title}</span>${title} details.</mb-disclosure>`;

const disclosures = (accordion: MbAccordion): MbDisclosure[] => [...accordion.querySelectorAll('mb-disclosure')];

describe('mb-accordion', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('gives disclosures heading level 3 unless they set their own', async () => {
    const { element } = await mount<MbAccordion>(`<mb-accordion>${item('A')}${item('B', 'heading-level="4"')}</mb-accordion>`);
    const levels = disclosures(element).map((d) => part(d, 'heading').getAttribute('aria-level'));
    expect(levels).to.deep.equal(['3', '4']);
  });

  it('keeps only the first initially open disclosure in single mode', async () => {
    const { element } = await mount<MbAccordion>(`<mb-accordion>${item('A')}${item('B', 'open')}${item('C', 'open')}</mb-accordion>`);
    expect(disclosures(element).map((d) => d.open)).to.deep.equal([false, true, false]);
  });

  it('turning multiple off keeps the first open disclosure', async () => {
    const { element } = await mount<MbAccordion>(`<mb-accordion multiple>${item('A')}${item('B', 'open')}${item('C', 'open')}</mb-accordion>`);
    element.multiple = false;
    await settle(document.body);
    expect(disclosures(element).map((d) => d.open)).to.deep.equal([false, true, false]);
  });

  it('coordinates a disclosure added later', async () => {
    const { element } = await mount<MbAccordion>(`<mb-accordion>${item('A', 'open')}</mb-accordion>`);
    element.insertAdjacentHTML('beforeend', item('B'));
    await settle(document.body);
    const [first, second] = disclosures(element) as [MbDisclosure, MbDisclosure];
    second.open = true;
    await settle(document.body);
    expect([first.open, second.open]).to.deep.equal([false, true]);
  });
});
```

`test/browser/components/conformance.test.ts`:

```ts
import '../../../src/components/define/all.ts';
import type { MbAccordion, MbDisclosure } from '../../../src/components/index.ts';
import { accordionConformance, disclosureConformance } from '../../../src/core/testing/index.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const audit = expectNoAxeViolations;

before(loadTokens);

disclosureConformance({
  name: 'mb-disclosure',
  driver,
  audit,
  async mount() {
    const { element, container } = await mount<MbDisclosure>(
      '<mb-disclosure><span slot="summary">Shipping details</span>Ships in two days.</mb-disclosure>',
    );
    return { trigger: part(element, 'trigger'), panel: part(element, 'panel'), teardown: () => container.remove() };
  },
});

accordionConformance({
  name: 'mb-accordion',
  driver,
  audit,
  async mount(spec) {
    const items = ['Shipping', 'Returns', 'Warranty']
      .map((title) => `<mb-disclosure><span slot="summary">${title}</span>${title} details.</mb-disclosure>`)
      .join('');
    const { element, container } = await mount<MbAccordion>(
      `<mb-accordion${spec.multiple ? ' multiple' : ''}>${items}</mb-accordion>`,
    );
    return {
      items: [...element.querySelectorAll<MbDisclosure>('mb-disclosure')].map((disclosure) => ({
        trigger: part(disclosure, 'trigger'),
        panel: part(disclosure, 'panel'),
      })),
      teardown: () => container.remove(),
    };
  },
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx web-test-runner --files test/browser/components/accordion.test.ts test/browser/components/conformance.test.ts`
Expected: FAIL: `src/components/define/accordion.ts` cannot be loaded.

- [ ] **Step 3: Implement**

`src/lit/controllers.ts`:

```ts
import type { ReactiveControllerHost } from 'lit';
import {
  attachAccordion,
  type AccordionElements,
  type AttachAccordionOptions,
} from '../core/dom/accordion.ts';
import { attachDialog, type AttachDialogOptions, type DialogElements } from '../core/dom/dialog.ts';
import {
  attachDisclosure,
  type AttachDisclosureOptions,
  type DisclosureElements,
} from '../core/dom/disclosure.ts';
import { attachListbox, type AttachListboxOptions, type ListboxElements } from '../core/dom/listbox.ts';
import { AccordionState } from '../core/state/accordion.ts';
import { DialogState } from '../core/state/dialog.ts';
import { DisclosureState, type DisclosureStateOptions } from '../core/state/disclosure.ts';
import { ListboxState } from '../core/state/listbox.ts';
import { BehaviorController, type Pending } from './behavior-controller.ts';

/** Lit controller for {@link attachListbox}. */
export class ListboxController extends BehaviorController<ListboxState, ListboxElements> {
  constructor(
    host: ReactiveControllerHost,
    elements: () => Pending<ListboxElements>,
    options: AttachListboxOptions = {},
  ) {
    super(
      host,
      options.state ?? new ListboxState(options),
      elements,
      (els, state) => attachListbox(els, { ...options, state }),
      ['root'],
    );
  }
}

/** Lit controller for {@link attachDisclosure}. */
export class DisclosureController extends BehaviorController<DisclosureState, DisclosureElements> {
  constructor(
    host: ReactiveControllerHost,
    elements: () => Pending<DisclosureElements>,
    options: AttachDisclosureOptions & DisclosureStateOptions = {},
  ) {
    super(
      host,
      options.state ?? new DisclosureState(options),
      elements,
      (els, state) => attachDisclosure(els, { state }),
      ['trigger', 'panel'],
    );
  }
}

/** Lit controller for {@link attachDialog}. */
export class DialogController extends BehaviorController<DialogState, DialogElements> {
  constructor(
    host: ReactiveControllerHost,
    elements: () => Pending<DialogElements>,
    options: AttachDialogOptions = {},
  ) {
    super(
      host,
      options.state ?? new DialogState(),
      elements,
      (els, state) => attachDialog(els, { ...options, state }),
      ['dialog'],
    );
  }
}

/** Lit controller for {@link attachAccordion}. */
export class AccordionController extends BehaviorController<AccordionState, AccordionElements> {
  constructor(
    host: ReactiveControllerHost,
    elements: () => Pending<AccordionElements>,
    options: AttachAccordionOptions = {},
  ) {
    super(
      host,
      options.state ?? new AccordionState(options),
      elements,
      (els, state) => attachAccordion(els, { ...options, state }),
      ['items'],
    );
  }
}
```

`src/lit/index.ts`:

```ts
export type { Constructor } from './constructor.ts';
export { BehaviorController, type Pending, type Subscribable } from './behavior-controller.ts';
export {
  AccordionController,
  DialogController,
  DisclosureController,
  ListboxController,
} from './controllers.ts';
export {
  FormAssociated,
  requiredValidator,
  type FormAssociatedElement,
  type ValidationResult,
  type Validator,
} from './form-associated.ts';
export { DelegatesFocus } from './delegates-focus.ts';
```

`src/components/accordion/accordion.styles.ts`:

```ts
import { css } from 'lit';
import { hostStyles } from '../shared/styles.ts';

export const accordionStyles = [
  hostStyles,
  css`
    :host {
      display: block;
    }

    [part='base'] {
      border-block-start: 1px solid var(--mb-accordion-border-color, var(--mb-color-border-default));
    }
  `,
];
```

`src/components/accordion/accordion.ts`:

```ts
import { LitElement, html, type PropertyValues } from 'lit';
import { AccordionController } from '../../lit/controllers.ts';
import { MbDisclosure } from '../disclosure/disclosure.ts';
import { accordionStyles } from './accordion.styles.ts';

/**
 * A stack of disclosures. By default, opening one closes the others.
 *
 * @tag mb-accordion
 * @slot - `mb-disclosure` elements.
 * @csspart base - The wrapper around the disclosures.
 * @cssprop --mb-accordion-border-color - Divider above the first disclosure.
 */
export class MbAccordion extends LitElement {
  static override styles = accordionStyles;
  static override properties = {
    multiple: { type: Boolean, reflect: true },
    headingLevel: { type: Number, attribute: 'heading-level' },
  };

  /** Allow several disclosures to be open at once. */
  declare multiple: boolean;
  /** Heading level for disclosures that do not set their own. Defaults to 3. */
  declare headingLevel: number;

  readonly accordion = new AccordionController(this, () => ({
    items: () => this.#disclosures().map((disclosure) => disclosure.disclosure),
  }));

  constructor() {
    super();
    this.multiple = false;
    this.headingLevel = 3;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('multiple')) this.accordion.state.setMultiple(this.multiple);
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    for (const disclosure of this.#disclosures()) {
      if (!disclosure.hasAttribute('heading-level')) disclosure.headingLevel = this.headingLevel;
    }
  }

  override render() {
    return html`<div part="base"><slot @slotchange=${() => this.requestUpdate()}></slot></div>`;
  }

  #disclosures(): MbDisclosure[] {
    return [...this.children].filter((child): child is MbDisclosure => child instanceof MbDisclosure);
  }
}
```

`src/components/define/accordion.ts`:

```ts
import { MbAccordion } from '../accordion/accordion.ts';
import { define } from '../shared/define.ts';
import './disclosure.ts';

define('mb-accordion', MbAccordion);

declare global {
  interface HTMLElementTagNameMap {
    'mb-accordion': MbAccordion;
  }
}
```

`src/components/define/all.ts`:

```ts
import './accordion.ts';
import './button.ts';
import './disclosure.ts';
```

`src/components/index.ts`:

```ts
export { MbAccordion } from './accordion/accordion.ts';
export { MbButton, type ButtonType, type ButtonVariant } from './button/button.ts';
export { MbDisclosure } from './disclosure/disclosure.ts';
export { colorRoles, type ColorRole } from './shared/color.ts';
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx web-test-runner --files test/browser/components/accordion.test.ts test/browser/components/conformance.test.ts && npm run typecheck && npm run lint`
Expected: 24 passed in each browser (4 component tests, 20 conformance tests: 6 disclosure, 14 accordion).

- [ ] **Step 5: Commit**

```bash
git add src/components/accordion/accordion.styles.ts src/components/accordion/accordion.ts src/components/define/accordion.ts src/components/define/all.ts src/components/index.ts src/lit/controllers.ts src/lit/index.ts test/browser/components/accordion.test.ts test/browser/components/conformance.test.ts
git commit -m "Add mb-accordion and AccordionController"
```

---

### Task 8: `mb-dialog`

**Files:**
- `test/browser/components/dialog.test.ts`
- `test/browser/components/conformance.test.ts`
- `src/core/testing/driver.ts`
- `src/core/testing/dialog.ts`
- `src/core/testing/index.ts`
- `src/core/dom/dialog.ts`
- `src/components/dialog/dialog.styles.ts`
- `src/components/dialog/dialog.ts`
- `src/components/define/dialog.ts`
- `src/components/define/all.ts`
- `src/components/index.ts`

**Interfaces:**
- Consumes: `DialogController` (v1), `mb-button` (Task 5) for the close button.
- Produces: `class MbDialog` with `open` (reflected; accessor over state), `label`, `color`, `persistent`, `closeLabel` (`close-label`), `returnValue`, `show()`, `close(returnValue?)`, custom state `open`, and `close` and `cancel` events re-dispatched from the host.
- Core change: `AttachDialogOptions.dismissOnOutsideClick?: boolean | (() => boolean)`, read at click time, so `persistent` can change after attach.
- Suite change: `containsComposed(ancestor, node)` (exported from `core/testing`) checks containment through slots and shadow roots. The dialog suite's "focus inside" check uses it: focus lands on the close button's inner `<button>`, inside `mb-button`'s shadow root, which `Node.contains` cannot see.

- [ ] **Step 1: Write the failing tests**

`test/browser/components/dialog.test.ts`:

```ts
import { expect } from 'chai';
import { sendKeys } from '@web/test-runner-commands';
import '../../../src/components/define/dialog.ts';
import type { MbDialog } from '../../../src/components/index.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

async function mountDialog(attributes = '', content = '<p>Body</p>'): Promise<MbDialog> {
  const { element } = await mount<MbDialog>(`<mb-dialog label="Confirm" ${attributes}>${content}</mb-dialog>`);
  return element;
}

describe('mb-dialog', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('show() opens it modally, reflects open, and sets :state(open)', async () => {
    const dialog = await mountDialog();
    dialog.show();
    await settle(document.body);
    expect(part<HTMLDialogElement>(dialog, 'dialog').matches(':modal')).to.equal(true);
    expect(dialog.hasAttribute('open')).to.equal(true);
    expect(dialog.matches(':state(open)')).to.equal(true);
  });

  it('opens from the open attribute', async () => {
    const dialog = await mountDialog('open');
    expect(part<HTMLDialogElement>(dialog, 'dialog').open).to.equal(true);
    dialog.close();
  });

  it('close(value) closes, sets returnValue, and fires close from the host', async () => {
    const dialog = await mountDialog();
    const events: string[] = [];
    const closed = new Promise((resolve) => dialog.addEventListener('close', resolve, { once: true }));
    dialog.addEventListener('close', () => events.push('close'));
    dialog.show();
    dialog.close('saved');
    await closed;
    expect([dialog.open, dialog.returnValue, events]).to.deep.equal([false, 'saved', ['close']]);
  });

  it('a slotted form with method="dialog" closes it with the submitter value', async () => {
    const dialog = await mountDialog('', '<form method="dialog" slot="footer"><button value="confirm">OK</button></form>');
    dialog.show();
    (dialog.querySelector('button') as HTMLButtonElement).click();
    await tick();
    expect([dialog.open, dialog.returnValue]).to.deep.equal([false, 'confirm']);
  });

  it('Escape fires cancel from the host, and preventing it keeps the dialog open', async () => {
    const dialog = await mountDialog();
    dialog.addEventListener('cancel', (event) => event.preventDefault());
    dialog.show();
    await settle(document.body);
    // Browsers honor a prevented cancel only after a user activation.
    await driver.click(part(dialog, 'body'));
    await sendKeys({ press: 'Escape' });
    await tick();
    expect(dialog.open).to.equal(true);
    dialog.close();
  });

  it('persistent ignores outside clicks until it is removed', async () => {
    const dialog = await mountDialog('persistent');
    dialog.show();
    await settle(document.body);
    await driver.click({ x: 2, y: 2 });
    await tick();
    expect(dialog.open).to.equal(true);
    dialog.persistent = false;
    await settle(document.body);
    await driver.click({ x: 2, y: 2 });
    await tick();
    expect(dialog.open).to.equal(false);
  });

  it('the close button is named by close-label and closes the dialog', async () => {
    const dialog = await mountDialog('close-label="Dismiss"');
    dialog.show();
    await settle(document.body);
    const close = part(dialog, 'close-button');
    expect(close.textContent?.trim()).to.equal('Dismiss');
    await driver.click(close);
    await tick();
    expect(dialog.open).to.equal(false);
  });

  it('the heading slot replaces the label, and the footer hides when empty', async () => {
    const dialog = await mountDialog('', '<span slot="heading">Custom title</span>');
    const title = part(dialog, 'title');
    const slot = title.querySelector('slot') as HTMLSlotElement;
    expect(slot.assignedNodes()[0]?.textContent).to.equal('Custom title');
    expect(part(dialog, 'footer').hidden).to.equal(true);
  });
});
```

`test/browser/components/conformance.test.ts`:

```ts
import '../../../src/components/define/all.ts';
import type { MbAccordion, MbDialog, MbDisclosure } from '../../../src/components/index.ts';
import {
  accordionConformance,
  dialogConformance,
  disclosureConformance,
} from '../../../src/core/testing/index.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const audit = expectNoAxeViolations;

before(loadTokens);

disclosureConformance({
  name: 'mb-disclosure',
  driver,
  audit,
  async mount() {
    const { element, container } = await mount<MbDisclosure>(
      '<mb-disclosure><span slot="summary">Shipping details</span>Ships in two days.</mb-disclosure>',
    );
    return { trigger: part(element, 'trigger'), panel: part(element, 'panel'), teardown: () => container.remove() };
  },
});

dialogConformance({
  name: 'mb-dialog',
  driver,
  audit,
  async mount() {
    const { element, container } = await mount<HTMLElement>(`
      <mb-button>Place order</mb-button>
      <mb-dialog label="Confirm order">
        <p>Your card will be charged now.</p>
        <form method="dialog" slot="footer"><button value="confirm">Confirm</button></form>
      </mb-dialog>`);
    const dialog = container.querySelector('mb-dialog') as MbDialog;
    element.addEventListener('click', () => dialog.show());
    return {
      trigger: part(element, 'base'),
      dialog: part<HTMLDialogElement>(dialog, 'dialog'),
      title: part(dialog, 'title'),
      confirm: container.querySelector('button[value=confirm]') as HTMLElement,
      teardown: () => container.remove(),
    };
  },
});

accordionConformance({
  name: 'mb-accordion',
  driver,
  audit,
  async mount(spec) {
    const items = ['Shipping', 'Returns', 'Warranty']
      .map((title) => `<mb-disclosure><span slot="summary">${title}</span>${title} details.</mb-disclosure>`)
      .join('');
    const { element, container } = await mount<MbAccordion>(
      `<mb-accordion${spec.multiple ? ' multiple' : ''}>${items}</mb-accordion>`,
    );
    return {
      items: [...element.querySelectorAll<MbDisclosure>('mb-disclosure')].map((disclosure) => ({
        trigger: part(disclosure, 'trigger'),
        panel: part(disclosure, 'panel'),
      })),
      teardown: () => container.remove(),
    };
  },
});
```

`src/core/testing/driver.ts`:

```ts
/**
 * Real input for a conformance suite. Implement it with your runner's
 * browser commands; synthetic events do not trigger native behavior such as
 * Escape closing a dialog.
 */
export interface Driver {
  /**
   * Presses one key on the focused element. Keys use Playwright names:
   * `ArrowDown`, `ArrowUp`, `Home`, `End`, `Space`, `Enter`, `Escape`, `Tab`,
   * or a single character.
   */
  press(key: string): Promise<void>;
  /** Clicks with a real pointer at the center of `target`, or at viewport coordinates. */
  click(target: Element | { x: number; y: number }): Promise<void>;
}

export type InteractionType = 'keyboard' | 'pointer';

/** Every suite runs once per interaction type. */
export const interactionTypes: readonly InteractionType[] = ['keyboard', 'pointer'];

/** Optional extra check, such as an axe run, called with the pattern's root element. */
export type Audit = (root: Element) => Promise<void>;

export function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}

/**
 * True if `node` is `ancestor` or inside it in the flat tree: through slot
 * assignment and out of shadow roots to their hosts.
 */
export function containsComposed(ancestor: Node, node: Node | null): boolean {
  for (let current: Node | null = node; current !== null; ) {
    if (current === ancestor) return true;
    const slot = current instanceof Element ? current.assignedSlot : null;
    current = slot ?? current.parentNode ?? (current instanceof ShadowRoot ? current.host : null);
  }
  return false;
}
```

`src/core/testing/dialog.ts`:

```ts
import { expect } from 'chai';
import { deepActiveElement } from '../a11y/active-element.ts';
import { containsComposed, interactionTypes, nextFrame, type Audit, type Driver } from './driver.ts';

export interface DialogFixture {
  /** Opens the dialog when activated. */
  trigger: HTMLElement;
  dialog: HTMLDialogElement;
  /** Labels the dialog. */
  title: HTMLElement;
  /** Closes the dialog with the return value `"confirm"`, e.g. `<button value="confirm">` in a `<form method="dialog">`. */
  confirm: HTMLElement;
  teardown(): void;
}

export interface DialogSuiteOptions {
  name: string;
  /** Mounts a closed dialog and its trigger into `document.body`. The dialog box must not cover the viewport's top-left corner. */
  mount: () => DialogFixture | Promise<DialogFixture>;
  driver: Driver;
  audit?: Audit;
}

/** Registers the modal dialog conformance suite (WAI-ARIA APG dialog pattern). */
export function dialogConformance({ name, mount, driver, audit }: DialogSuiteOptions): void {
  for (const interaction of interactionTypes) {
    describe(`${name}: dialog conformance (${interaction})`, () => {
      let fixture: DialogFixture;

      beforeEach(async () => {
        fixture = await mount();
        await nextFrame();
      });

      afterEach(() => {
        fixture.teardown();
      });

      const settle = async (): Promise<void> => {
        // The native close event is queued as a task.
        await new Promise((resolve) => setTimeout(resolve, 0));
        await nextFrame();
      };

      const activate = async (element: HTMLElement): Promise<void> => {
        if (interaction === 'keyboard') {
          element.focus();
          await driver.press('Enter');
        } else {
          await driver.click(element);
        }
        await settle();
      };

      it('opens as a labelled modal dialog with focus inside', async () => {
        await activate(fixture.trigger);
        const { dialog } = fixture;
        expect(dialog.open).to.equal(true);
        expect(dialog.matches(':modal'), 'modal').to.equal(true);
        expect(dialog.ariaLabelledByElements?.[0]).to.equal(fixture.title);
        expect(containsComposed(dialog, deepActiveElement()), 'focus inside').to.equal(true);
        if (audit) await audit(dialog);
      });

      it('closes with the confirm value', async () => {
        await activate(fixture.trigger);
        await activate(fixture.confirm);
        expect(fixture.dialog.open).to.equal(false);
        expect(fixture.dialog.returnValue).to.equal('confirm');
      });

      if (interaction === 'keyboard') {
        it('Escape closes and returns focus to the trigger', async () => {
          await activate(fixture.trigger);
          await driver.press('Escape');
          await settle();
          expect(fixture.dialog.open).to.equal(false);
          expect(deepActiveElement()).to.equal(fixture.trigger);
        });

        it('returns focus to the trigger after confirming', async () => {
          await activate(fixture.trigger);
          await activate(fixture.confirm);
          expect(deepActiveElement()).to.equal(fixture.trigger);
        });
      } else {
        it('a click outside the dialog closes it', async () => {
          await activate(fixture.trigger);
          await driver.click({ x: 2, y: 2 });
          await settle();
          expect(fixture.dialog.open).to.equal(false);
        });

        it('a click inside the dialog keeps it open', async () => {
          await activate(fixture.trigger);
          await driver.click(fixture.title);
          await settle();
          expect(fixture.dialog.open).to.equal(true);
        });
      }
    });
  }
}
```

`src/core/testing/index.ts`:

```ts
export {
  accordionConformance,
  type AccordionFixture,
  type AccordionItemFixture,
  type AccordionMountSpec,
  type AccordionSuiteOptions,
} from './accordion.ts';
export {
  containsComposed,
  interactionTypes,
  nextFrame,
  type Audit,
  type Driver,
  type InteractionType,
} from './driver.ts';
export {
  disclosureConformance,
  type DisclosureFixture,
  type DisclosureSuiteOptions,
} from './disclosure.ts';
export { dialogConformance, type DialogFixture, type DialogSuiteOptions } from './dialog.ts';
export {
  listboxConformance,
  listboxSuiteOptions,
  type ListboxFixture,
  type ListboxMountSpec,
  type ListboxOptionSpec,
  type ListboxSuiteOptions,
} from './listbox.ts';
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx web-test-runner --files test/browser/components/dialog.test.ts test/browser/components/conformance.test.ts`
Expected: FAIL: `src/components/define/dialog.ts` cannot be loaded.

- [ ] **Step 3: Implement**

`src/core/dom/dialog.ts`:

```ts
import { DialogState } from '../state/dialog.ts';
import { AttributeWriter } from './attribute-writer.ts';
import type { Behavior } from './behavior.ts';

export interface DialogElements {
  /** Must be closed when attached. */
  dialog: HTMLDialogElement;
  /** Labels the dialog. */
  title?: HTMLElement;
}

export interface AttachDialogOptions {
  state?: DialogState;
  /**
   * Close when a click starts and ends outside the dialog box. Defaults to
   * true. Pass a function to decide at click time, e.g. from an attribute.
   */
  dismissOnOutsideClick?: boolean | (() => boolean);
}

function isOutside(dialog: HTMLDialogElement, event: MouseEvent): boolean {
  if (event.target !== dialog) return false;
  const box = dialog.getBoundingClientRect();
  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );
}

/**
 * Modal dialog behavior on the native `<dialog>`. The platform provides the
 * focus trap, inert background, top layer, Escape, and focus restore.
 *
 * Writes on the dialog: `ariaLabelledByElements` when a title is given.
 * `state.show()` calls `showModal()`; `state.close(value)` calls
 * `close(value)`; a native close (Escape, `<form method="dialog">`) updates
 * the state with the dialog's `returnValue`, and a native open updates it
 * too. `sync()` rewrites references only; it never opens or closes.
 */
export function attachDialog(
  elements: DialogElements,
  options: AttachDialogOptions = {},
): Behavior<DialogState> {
  const { dialog, title } = elements;
  const state = options.state ?? new DialogState();
  const writer = new AttributeWriter();
  const controller = new AbortController();
  const { signal } = controller;

  const writeReferences = (): void => {
    writer.writeReferences(dialog, { ariaLabelledByElements: title ? [title] : null });
  };

  const render = (): void => {
    writeReferences();
    if (state.open && !dialog.open) {
      dialog.returnValue = '';
      dialog.showModal();
    } else if (!state.open && dialog.open) {
      dialog.close(state.returnValue);
    }
  };

  // Adopt a dialog opened natively (showModal(), a command invoker) into the state.
  dialog.addEventListener(
    'toggle',
    (event) => {
      if (event.newState !== 'open' || state.open) return;
      dialog.returnValue = '';
      state.show();
    },
    { signal },
  );

  // The close event is queued, so the dialog may have reopened before it runs.
  dialog.addEventListener(
    'close',
    () => {
      if (!dialog.open) state.close(dialog.returnValue);
    },
    { signal },
  );

  const dismiss = options.dismissOnOutsideClick ?? true;
  const dismissOnOutsideClick = typeof dismiss === 'function' ? dismiss : () => dismiss;
  let pressedOutside = false;
  dialog.addEventListener(
    'pointerdown',
    (event) => {
      pressedOutside = isOutside(dialog, event);
    },
    { signal },
  );
  dialog.addEventListener(
    'click',
    (event) => {
      if (pressedOutside && isOutside(dialog, event) && dismissOnOutsideClick()) state.close();
      pressedOutside = false;
    },
    { signal },
  );

  const unsubscribe = state.subscribe(render);
  render();

  return {
    state,
    sync: writeReferences,
    dispose() {
      controller.abort();
      unsubscribe();
      writer.releaseAll();
    },
  };
}
```

`src/components/dialog/dialog.styles.ts`:

```ts
import { css } from 'lit';
import { colorRoleStyles, hostStyles } from '../shared/styles.ts';

export const dialogStyles = [
  hostStyles,
  colorRoleStyles,
  css`
    :host {
      display: block;
    }

    [part='dialog'] {
      inline-size: min(var(--mb-dialog-width, 32rem), calc(100vw - 2 * var(--mb-space-inline-lg)));
      max-block-size: calc(100dvh - 2 * var(--mb-space-stack-lg));
      padding: 0;
      border: 1px solid var(--mb-dialog-border-color, var(--mb-color-border-default));
      border-block-start: var(--mb-dialog-accent-width, 4px) solid var(--mb-dialog-accent-color, var(--_solid));
      border-radius: var(--mb-dialog-radius, var(--mb-radius-surface));
      background: var(--mb-dialog-bg, var(--mb-color-bg-surface-raised));
      color: var(--mb-color-fg-default);
      box-shadow: var(--mb-dialog-shadow, var(--mb-shadow-overlay));
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-font-size-body);
      line-height: var(--mb-line-height-body);
    }

    [part='dialog'].color-neutral {
      border-block-start-width: var(--mb-dialog-accent-width, 1px);
      border-block-start-color: var(--mb-dialog-accent-color, var(--mb-dialog-border-color, var(--mb-color-border-default)));
    }

    [part='dialog']::backdrop {
      background: var(--mb-dialog-backdrop, rgb(0 0 0 / 0.4));
    }

    [part='header'] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--mb-space-inline-md);
      padding: var(--mb-space-stack-lg) var(--mb-space-inline-lg) 0;
    }

    [part='title'] {
      margin: 0;
      font-size: var(--mb-dialog-title-font-size, 1.25rem);
      font-weight: var(--mb-font-weight-strong);
    }

    [part='body'] {
      padding: var(--mb-space-stack-md) var(--mb-space-inline-lg);
    }

    [part='footer'] {
      display: flex;
      justify-content: flex-end;
      gap: var(--mb-space-inline-sm);
      padding: 0 var(--mb-space-inline-lg) var(--mb-space-stack-lg);
    }

    [part='close-button'] {
      --mb-button-padding-inline: var(--mb-space-inline-sm);
    }

    .visually-hidden {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    svg {
      inline-size: 1rem;
      block-size: 1rem;
    }

    @media (forced-colors: active) {
      [part='dialog'] {
        border-color: CanvasText;
      }
    }
  `,
];
```

`src/components/dialog/dialog.ts`:

```ts
import { LitElement, html } from 'lit';
import { DialogController } from '../../lit/controllers.ts';
import { colorRole, type ColorRole } from '../shared/color.ts';
import { dialogStyles } from './dialog.styles.ts';

/**
 * A modal dialog on the native `<dialog>` element.
 *
 * A `<form method="dialog">` inside closes the dialog with its submit
 * button's `value` as `returnValue`.
 *
 * @tag mb-dialog
 * @slot heading - The title. Defaults to `label`.
 * @slot - The body.
 * @slot footer - Actions, usually buttons.
 * @csspart dialog - The native dialog.
 * @csspart header - The header row.
 * @csspart title - The heading that labels the dialog.
 * @csspart close-button - The close button, an `mb-button`.
 * @csspart body - The body wrapper.
 * @csspart footer - The footer wrapper.
 * @cssstate open - The dialog is open.
 * @cssprop --mb-dialog-width - Maximum width.
 * @cssprop --mb-dialog-bg - Background.
 * @cssprop --mb-dialog-border-color - Border color.
 * @cssprop --mb-dialog-accent-color - Top border color.
 * @cssprop --mb-dialog-accent-width - Top border width.
 * @cssprop --mb-dialog-radius - Corner radius.
 * @cssprop --mb-dialog-shadow - Shadow.
 * @cssprop --mb-dialog-backdrop - Backdrop color.
 * @cssprop --mb-dialog-title-font-size - Title font size.
 * @fires close - After the dialog closes, for any reason.
 * @fires cancel - When Escape is pressed. Cancelable: preventing it keeps the dialog open.
 */
export class MbDialog extends LitElement {
  static override styles = dialogStyles;
  static override properties = {
    open: { type: Boolean, reflect: true, noAccessor: true },
    label: {},
    color: {},
    persistent: { type: Boolean, reflect: true },
    closeLabel: { attribute: 'close-label' },
  };

  /** The title, used when the `heading` slot is empty. */
  declare label: string;
  declare color: ColorRole;
  /** Keep the dialog open on an outside click. Escape still closes it. */
  declare persistent: boolean;
  /** Accessible name of the close button. */
  declare closeLabel: string;

  readonly #dialog = new DialogController(
    this,
    () => ({
      dialog: this.renderRoot.querySelector('dialog'),
      title: this.renderRoot.querySelector<HTMLElement>('[part=title]'),
    }),
    { dismissOnOutsideClick: () => !this.persistent },
  );

  readonly #internals: ElementInternals;
  #hasFooter = false;

  constructor() {
    super();
    this.label = '';
    this.color = 'neutral';
    this.persistent = false;
    this.closeLabel = 'Close';
    this.#internals = this.attachInternals();
    this.#dialog.state.subscribe(() => {
      this.requestUpdate('open', !this.open);
      if (this.open) this.#internals.states.add('open');
      else this.#internals.states.delete('open');
    });
    this.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.method !== 'dialog' || form.closest('mb-dialog') !== this) return;
      event.preventDefault();
      const submitter = event.submitter as HTMLButtonElement | HTMLInputElement | null;
      this.close(submitter?.value ?? '');
    });
  }

  /** Whether the dialog is open. Setting it calls `show()` or `close()`. */
  get open(): boolean {
    return this.#dialog.state.open;
  }

  set open(open: boolean) {
    if (open) this.show();
    else this.close();
  }

  /** The value the dialog last closed with; cleared when it opens. */
  get returnValue(): string {
    return this.#dialog.state.returnValue;
  }

  show(): void {
    this.#dialog.state.show();
  }

  close(returnValue?: string): void {
    this.#dialog.state.close(returnValue);
  }

  override render() {
    return html`<dialog part="dialog" class="color-${colorRole(this.color)}" @close=${this.#onClose} @cancel=${this.#onCancel}>
      <header part="header">
        <h2 part="title"><slot name="heading">${this.label}</slot></h2>
        <mb-button part="close-button" variant="ghost" @click=${() => this.close()}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" fill="none" /></svg>
          <span class="visually-hidden">${this.closeLabel}</span>
        </mb-button>
      </header>
      <div part="body"><slot></slot></div>
      <footer part="footer" ?hidden=${!this.#hasFooter}>
        <slot name="footer" @slotchange=${this.#onFooterChange}></slot>
      </footer>
    </dialog>`;
  }

  #onClose(): void {
    this.dispatchEvent(new Event('close'));
  }

  #onCancel(event: Event): void {
    if (!this.dispatchEvent(new Event('cancel', { cancelable: true }))) event.preventDefault();
  }

  #onFooterChange(event: Event): void {
    this.#hasFooter = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
    this.requestUpdate();
  }
}
```

`src/components/define/dialog.ts`:

```ts
import { MbDialog } from '../dialog/dialog.ts';
import './button.ts';
import { define } from '../shared/define.ts';

define('mb-dialog', MbDialog);

declare global {
  interface HTMLElementTagNameMap {
    'mb-dialog': MbDialog;
  }
}
```

`src/components/define/all.ts`:

```ts
import './accordion.ts';
import './button.ts';
import './dialog.ts';
import './disclosure.ts';
```

`src/components/index.ts`:

```ts
export { MbAccordion } from './accordion/accordion.ts';
export { MbButton, type ButtonType, type ButtonVariant } from './button/button.ts';
export { MbDialog } from './dialog/dialog.ts';
export { MbDisclosure } from './disclosure/disclosure.ts';
export { colorRoles, type ColorRole } from './shared/color.ts';
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx web-test-runner --files test/browser/components/dialog.test.ts test/browser/components/conformance.test.ts test/browser/dialog.test.ts test/browser/lit-controllers.test.ts && npm run typecheck && npm run lint`
Expected: In each browser: 8 dialog component tests, 28 component conformance tests (6 disclosure, 8 dialog, 14 accordion), and the v1 dialog and Lit controller files still pass (12 and 44).

- [ ] **Step 5: Commit**

```bash
git add src/components/define/all.ts src/components/define/dialog.ts src/components/dialog/dialog.styles.ts src/components/dialog/dialog.ts src/components/index.ts src/core/dom/dialog.ts src/core/testing/dialog.ts src/core/testing/driver.ts src/core/testing/index.ts test/browser/components/conformance.test.ts test/browser/components/dialog.test.ts
git commit -m "Add mb-dialog"
```

---

### Task 9: `mb-listbox` and `mb-option`

**Files:**
- `test/browser/components/listbox.test.ts`
- `test/browser/components/conformance.test.ts`
- `src/components/listbox/option.styles.ts`
- `src/components/listbox/option.ts`
- `src/components/listbox/listbox.styles.ts`
- `src/components/listbox/listbox.ts`
- `src/components/define/listbox.ts`
- `src/components/define/all.ts`
- `src/components/index.ts`

**Interfaces:**
- Consumes: `ListboxController` (v1), `ListboxState.setMultiple` (Task 2), `FormAssociated` (v1).
- Produces: `class MbOption` (`value` defaults to text content, `disabled` reflected, `defaultSelected` ↔ `selected` attribute, read-only `selected`); `class MbListbox` (`label`, `multiple`, `color`, plus the mixin's `name`, `value`, `required`, `disabled`; `values: string[]`; `input`/`change` on user selection only).
- `mb-listbox` overrides `focus()` and handles label clicks (a `click` whose target is the host) to focus the active option, because `delegatesFocus` does not reach slotted light-DOM options; the planning spike confirmed focus otherwise stays on `body` in all three engines.

- [ ] **Step 1: Write the failing tests**

`test/browser/components/listbox.test.ts`:

```ts
import { expect } from 'chai';
import { sendMouse } from '@web/test-runner-commands';
import '../../../src/components/define/listbox.ts';
import type { MbListbox, MbOption } from '../../../src/components/index.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const fruit = '<mb-option>Apple</mb-option><mb-option value="b">Banana</mb-option><mb-option>Cherry</mb-option>';

async function mountListbox(attributes = '', options = fruit): Promise<MbListbox> {
  const { element } = await mount<MbListbox>(`<mb-listbox label="Fruit" ${attributes}>${options}</mb-listbox>`);
  return element;
}

const optionsOf = (listbox: MbListbox): MbOption[] => [...listbox.querySelectorAll('mb-option')];
const option = (listbox: MbListbox, index: number): MbOption => optionsOf(listbox)[index];

async function inForm(markup: string): Promise<{ form: HTMLFormElement; listbox: MbListbox }> {
  const { element: form } = await mount<HTMLFormElement>(`<form>${markup}</form>`);
  return { form, listbox: form.querySelector('mb-listbox') as MbListbox };
}

describe('mb-listbox', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('option value defaults to its text and follows text changes', async () => {
    const listbox = await mountListbox();
    expect(optionsOf(listbox).map((o) => o.value)).to.deep.equal(['Apple', 'b', 'Cherry']);
    option(listbox, 2).textContent = 'Date';
    await settle(document.body);
    listbox.value = 'Date';
    await settle(document.body);
    expect(option(listbox, 2).selected).to.equal(true);
  });

  it('value and values follow the selection in option order', async () => {
    const listbox = await mountListbox('multiple');
    listbox.values = ['Cherry', 'Apple'];
    await settle(document.body);
    expect([listbox.value, listbox.values]).to.deep.equal(['Apple', ['Apple', 'Cherry']]);
    listbox.value = 'b';
    await settle(document.body);
    expect(listbox.values).to.deep.equal(['b']);
  });

  it('submits one entry per selected value under its name', async () => {
    const { form, listbox } = await inForm(`<mb-listbox label="Fruit" name="fruit" multiple>${fruit}</mb-listbox>`);
    listbox.values = ['Apple', 'b'];
    await settle(document.body);
    expect(new FormData(form).getAll('fruit')).to.deep.equal(['Apple', 'b']);
  });

  it('required fails until something is selected', async () => {
    const { listbox } = await inForm(`<mb-listbox label="Fruit" name="fruit" required>${fruit}</mb-listbox>`);
    expect(listbox.validity.valueMissing).to.equal(true);
    listbox.value = 'Apple';
    await settle(document.body);
    expect(listbox.validity.valid).to.equal(true);
  });

  it('starts with options marked selected and returns to them on reset', async () => {
    const options = '<mb-option>Apple</mb-option><mb-option selected>Banana</mb-option>';
    const { form, listbox } = await inForm(`<mb-listbox label="Fruit" name="fruit">${options}</mb-listbox>`);
    expect(listbox.value).to.equal('Banana');
    listbox.value = 'Apple';
    await settle(document.body);
    form.reset();
    await settle(document.body);
    expect(listbox.value).to.equal('Banana');
  });

  it('a disabled fieldset disables every option', async () => {
    const { listbox } = await inForm(`<fieldset disabled><mb-listbox label="Fruit">${fruit}</mb-listbox></fieldset>`);
    await settle(document.body);
    expect(optionsOf(listbox).map((o) => o.getAttribute('aria-disabled'))).to.deep.equal(['true', 'true', 'true']);
  });

  it('fires input and change on user selection only', async () => {
    const listbox = await mountListbox();
    const events: string[] = [];
    listbox.addEventListener('input', () => events.push('input'));
    listbox.addEventListener('change', () => events.push('change'));
    listbox.value = 'Cherry';
    await settle(document.body);
    expect(events).to.deep.equal([]);
    await driver.click(option(listbox, 0));
    expect(events).to.deep.equal(['input', 'change']);
    await driver.click(option(listbox, 0));
    expect(events).to.deep.equal(['input', 'change']);
  });

  it('focus() and a label click move focus to the active option', async () => {
    const { container } = await mount(`<label for="fruit">Fruit</label><mb-listbox id="fruit" label="Fruit">${fruit}</mb-listbox>`);
    const listbox = container.querySelector('mb-listbox') as MbListbox;
    listbox.focus();
    expect(document.activeElement).to.equal(option(listbox, 0));
    (document.activeElement as HTMLElement).blur();
    const box = (container.querySelector('label') as HTMLElement).getBoundingClientRect();
    await sendMouse({ type: 'click', position: [Math.round(box.left + 2), Math.round(box.top + 2)] });
    expect(document.activeElement).to.equal(option(listbox, 0));
  });

  it('turning multiple off keeps the first selected option and updates the ARIA', async () => {
    const listbox = await mountListbox('multiple');
    listbox.values = ['b', 'Cherry'];
    listbox.multiple = false;
    await settle(document.body);
    expect(listbox.values).to.deep.equal(['b']);
    expect(part(listbox, 'listbox').hasAttribute('aria-multiselectable')).to.equal(false);
  });

  it('names the listbox from its label', async () => {
    const listbox = await mountListbox();
    expect(part(listbox, 'listbox').ariaLabelledByElements?.[0]).to.equal(part(listbox, 'label'));
  });
});
```

`test/browser/components/conformance.test.ts`:

```ts
import '../../../src/components/define/all.ts';
import type { MbAccordion, MbDialog, MbDisclosure, MbListbox } from '../../../src/components/index.ts';
import {
  accordionConformance,
  dialogConformance,
  disclosureConformance,
  listboxConformance,
} from '../../../src/core/testing/index.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const audit = expectNoAxeViolations;

before(loadTokens);

disclosureConformance({
  name: 'mb-disclosure',
  driver,
  audit,
  async mount() {
    const { element, container } = await mount<MbDisclosure>(
      '<mb-disclosure><span slot="summary">Shipping details</span>Ships in two days.</mb-disclosure>',
    );
    return { trigger: part(element, 'trigger'), panel: part(element, 'panel'), teardown: () => container.remove() };
  },
});

dialogConformance({
  name: 'mb-dialog',
  driver,
  audit,
  async mount() {
    const { element, container } = await mount<HTMLElement>(`
      <mb-button>Place order</mb-button>
      <mb-dialog label="Confirm order">
        <p>Your card will be charged now.</p>
        <form method="dialog" slot="footer"><button value="confirm">Confirm</button></form>
      </mb-dialog>`);
    const dialog = container.querySelector('mb-dialog') as MbDialog;
    element.addEventListener('click', () => dialog.show());
    return {
      trigger: part(element, 'base'),
      dialog: part<HTMLDialogElement>(dialog, 'dialog'),
      title: part(dialog, 'title'),
      confirm: container.querySelector('button[value=confirm]') as HTMLElement,
      teardown: () => container.remove(),
    };
  },
});

listboxConformance({
  name: 'mb-listbox',
  driver,
  audit,
  async mount(spec) {
    const options = spec.options
      .map((option) => `<mb-option${option.disabled ? ' disabled' : ''}>${option.label}</mb-option>`)
      .join('');
    const { element, container } = await mount<MbListbox>(
      `<mb-listbox label="Fruit"${spec.multiple ? ' multiple' : ''}>${options}</mb-listbox>`,
    );
    return {
      root: part(element, 'listbox'),
      options: [...element.querySelectorAll<HTMLElement>('mb-option')],
      teardown: () => container.remove(),
    };
  },
});

accordionConformance({
  name: 'mb-accordion',
  driver,
  audit,
  async mount(spec) {
    const items = ['Shipping', 'Returns', 'Warranty']
      .map((title) => `<mb-disclosure><span slot="summary">${title}</span>${title} details.</mb-disclosure>`)
      .join('');
    const { element, container } = await mount<MbAccordion>(
      `<mb-accordion${spec.multiple ? ' multiple' : ''}>${items}</mb-accordion>`,
    );
    return {
      items: [...element.querySelectorAll<MbDisclosure>('mb-disclosure')].map((disclosure) => ({
        trigger: part(disclosure, 'trigger'),
        panel: part(disclosure, 'panel'),
      })),
      teardown: () => container.remove(),
    };
  },
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx web-test-runner --files test/browser/components/listbox.test.ts test/browser/components/conformance.test.ts`
Expected: FAIL: `src/components/define/listbox.ts` cannot be loaded.

- [ ] **Step 3: Implement**

`src/components/listbox/option.styles.ts`:

```ts
import { css } from 'lit';
import { focusRing, hostStyles } from '../shared/styles.ts';

export const optionStyles = [
  hostStyles,
  css`
    :host {
      display: block;
      outline: none;
    }

    [part='base'] {
      display: flex;
      align-items: center;
      gap: var(--mb-option-gap, var(--mb-space-inline-sm));
      padding-block: var(--mb-option-padding-block, var(--mb-space-stack-sm));
      padding-inline: var(--mb-option-padding-inline, var(--mb-space-inline-sm));
      border-radius: var(--mb-option-radius, var(--mb-radius-control));
      color: var(--mb-option-fg, var(--mb-color-fg-default));
      cursor: pointer;
      user-select: none;
    }

    :host(:hover) [part='base'] {
      background: var(--mb-option-bg-hover, var(--mb-color-neutral-subtle));
    }

    :host([aria-selected='true']) [part='base'] {
      background: var(--mb-option-bg-selected, var(--_subtle, var(--mb-color-neutral-subtle)));
      color: var(--mb-option-fg-selected, var(--_text, var(--mb-color-neutral-text)));
    }

    :host(:focus-visible) [part='base'] {
      ${focusRing}
    }

    :host([aria-disabled='true']) [part='base'] {
      background: none;
      color: var(--mb-color-fg-disabled);
      cursor: not-allowed;
    }

    [part='check'] {
      display: var(--_check-display, none);
      position: relative;
      flex: none;
      inline-size: 1rem;
      block-size: 1rem;
      border: 1px solid currentColor;
      border-radius: 2px;
    }

    :host([aria-selected='true']) [part='check']::after {
      content: '';
      position: absolute;
      inset-block-start: 1px;
      inset-inline-start: 4px;
      inline-size: 5px;
      block-size: 9px;
      border-inline-end: 2px solid currentColor;
      border-block-end: 2px solid currentColor;
      transform: rotate(45deg);
    }

    [part='prefix'],
    [part='suffix'] {
      display: inline-flex;
    }

    [part='label'] {
      flex: 1;
    }

    @media (forced-colors: active) {
      :host([aria-selected='true']) [part='base'] {
        background: Highlight;
        color: HighlightText;
      }

      :host([aria-disabled='true']) [part='base'] {
        color: GrayText;
      }
    }
  `,
];
```

`src/components/listbox/option.ts`:

```ts
import { LitElement, html } from 'lit';
import { optionStyles } from './option.styles.ts';

/**
 * An option in an `mb-listbox`. The listbox writes its `role`,
 * `aria-selected`, `aria-disabled`, and `tabindex`.
 *
 * @tag mb-option
 * @slot - The label.
 * @slot prefix - Content before the label.
 * @slot suffix - Content after the label.
 * @csspart base - The row.
 * @csspart check - The checkbox, shown when the listbox is `multiple`.
 * @csspart prefix - The prefix wrapper.
 * @csspart label - The label wrapper.
 * @csspart suffix - The suffix wrapper.
 * @cssprop --mb-option-fg - Text color.
 * @cssprop --mb-option-bg-hover - Background on hover.
 * @cssprop --mb-option-bg-selected - Background when selected. Defaults to the listbox color role's subtle token.
 * @cssprop --mb-option-fg-selected - Text color when selected.
 * @cssprop --mb-option-radius - Corner radius.
 * @cssprop --mb-option-gap - Space between check, prefix, label, and suffix.
 * @cssprop --mb-option-padding-block - Vertical padding.
 * @cssprop --mb-option-padding-inline - Horizontal padding.
 */
export class MbOption extends LitElement {
  static override styles = optionStyles;
  static override properties = {
    value: { noAccessor: true },
    disabled: { type: Boolean, reflect: true },
    defaultSelected: { type: Boolean, attribute: 'selected' },
  };

  declare disabled: boolean;
  /** Selected when the listbox first connects and after a form reset, like `<option selected>`. */
  declare defaultSelected: boolean;

  #value: string | undefined;

  constructor() {
    super();
    this.disabled = false;
    this.defaultSelected = false;
  }

  /** The submitted value. Defaults to the text content. */
  get value(): string {
    return this.#value ?? this.textContent?.trim() ?? '';
  }

  set value(value: string | null | undefined) {
    const old = this.value;
    this.#value = value ?? undefined;
    this.requestUpdate('value', old);
  }

  /** Whether the option is currently selected. Change the selection on the listbox. */
  get selected(): boolean {
    return this.getAttribute('aria-selected') === 'true';
  }

  override render() {
    return html`<div part="base">
      <span part="check"></span>
      <span part="prefix"><slot name="prefix"></slot></span>
      <span part="label"><slot></slot></span>
      <span part="suffix"><slot name="suffix"></slot></span>
    </div>`;
  }
}
```

`src/components/listbox/listbox.styles.ts`:

```ts
import { css } from 'lit';
import { colorRoleStyles, hostStyles } from '../shared/styles.ts';

export const listboxStyles = [
  hostStyles,
  colorRoleStyles,
  css`
    :host {
      display: block;
    }

    [part='label'] {
      display: block;
      margin-block-end: var(--mb-space-stack-sm);
      color: var(--mb-color-fg-default);
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-font-size-body);
      font-weight: var(--mb-font-weight-strong);
    }

    [part='listbox'] {
      --_check-display: none;
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-block-size: var(--mb-listbox-max-height, none);
      overflow-y: auto;
      padding: var(--mb-listbox-padding, var(--mb-space-stack-sm));
      border: 1px solid var(--mb-listbox-border-color, var(--mb-color-border-strong));
      border-radius: var(--mb-listbox-radius, var(--mb-radius-control));
      background: var(--mb-listbox-bg, var(--mb-color-bg-surface));
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-font-size-body);
      line-height: var(--mb-line-height-body);
    }

    [part='listbox'].multiple {
      --_check-display: inline-block;
    }

    :host(:state(user-invalid)) [part='listbox'] {
      border-color: var(--mb-listbox-border-color-invalid, var(--mb-color-danger-border));
    }

    :host(:disabled) [part='listbox'] {
      background: var(--mb-color-bg-disabled);
    }

    @media (forced-colors: active) {
      [part='listbox'] {
        border-color: CanvasText;
      }
    }
  `,
];
```

`src/components/listbox/listbox.ts`:

```ts
import { LitElement, html, type PropertyValues } from 'lit';
import type { ListboxItem } from '../../core/state/listbox.ts';
import { ListboxController } from '../../lit/controllers.ts';
import { FormAssociated } from '../../lit/form-associated.ts';
import { colorRole, type ColorRole } from '../shared/color.ts';
import { listboxStyles } from './listbox.styles.ts';
import { MbOption } from './option.ts';

/**
 * A list of options to pick from, submitted with its form.
 *
 * @tag mb-listbox
 * @slot - `mb-option` elements.
 * @csspart label - The visible label, which also names the listbox.
 * @csspart listbox - The element with the listbox role.
 * @cssstate invalid - A validator fails, e.g. `required` with nothing selected.
 * @cssstate user-invalid - Invalid after the user changed the selection and left, or a submit was attempted.
 * @cssprop --mb-listbox-bg - Background.
 * @cssprop --mb-listbox-border-color - Border color.
 * @cssprop --mb-listbox-border-color-invalid - Border color when user-invalid.
 * @cssprop --mb-listbox-radius - Corner radius.
 * @cssprop --mb-listbox-padding - Padding around the options.
 * @cssprop --mb-listbox-max-height - Height after which the options scroll.
 * @fires input - After the user changes the selection.
 * @fires change - After the user changes the selection.
 */
export class MbListbox extends FormAssociated(LitElement) {
  static override styles = listboxStyles;
  static override properties = {
    label: {},
    multiple: { type: Boolean, reflect: true },
    color: {},
  };

  /** Visible label; also the listbox's accessible name. */
  declare label: string;
  declare multiple: boolean;
  /** The color role of selected options. */
  declare color: ColorRole;

  readonly listbox = new ListboxController(
    this,
    () => ({
      root: this.renderRoot.querySelector<HTMLElement>('[part=listbox]'),
      label: this.renderRoot.querySelector<HTMLElement>('[part=label]'),
      items: () => this.#options(),
    }),
    { describeItem: (element) => this.#describe(element as MbOption) },
  );

  #initialized = false;
  #before: readonly string[] = [];
  readonly #observer: MutationObserver;

  constructor() {
    super();
    this.label = '';
    this.multiple = false;
    this.color = 'neutral';
    this.listbox.state.subscribe(() => {
      const first = this.values[0] ?? '';
      if (this.value !== first) this.value = first;
    });
    // Snapshot the selection before the core handles an event, compare after.
    for (const type of ['keydown', 'click'] as const) {
      this.addEventListener(type, () => (this.#before = this.values), { capture: true });
      this.addEventListener(type, (event) => {
        if (type === 'click' && event.target === this) this.focus();
        this.#emitIfChanged();
      });
    }
    this.#observer = new MutationObserver(() => this.requestUpdate());
  }

  /** Values of all selected options, in option order. */
  get values(): string[] {
    const selected = this.listbox.state.selected;
    const inOrder = this.#options()
      .map((option) => option.value)
      .filter((value) => selected.has(value));
    return [...new Set([...inOrder, ...selected])];
  }

  set values(values: readonly string[]) {
    this.listbox.state.setSelected(values);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['value', 'disabled', 'selected'],
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  /** Focuses the active option; the listbox itself is not focusable. */
  override focus(options?: FocusOptions): void {
    const active = this.#options()[this.listbox.state.activeIndex];
    if (active) active.focus(options);
    else super.focus(options);
  }

  override formResetCallback(): void {
    super.formResetCallback();
    this.listbox.state.setSelected(this.#defaultValues());
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (state instanceof FormData) {
      this.values = state.getAll(this.name).filter((value): value is string => typeof value === 'string');
    } else {
      super.formStateRestoreCallback(state);
    }
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('multiple')) this.listbox.state.setMultiple(this.multiple);
    if (changed.has('value') && this.value !== (this.values[0] ?? '')) {
      this.listbox.state.setSelected(this.value === '' ? [] : [this.value]);
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (!this.#initialized && this.#options().length > 0) {
      this.#initialized = true;
      if (this.listbox.state.selected.size === 0) this.listbox.state.setSelected(this.#defaultValues());
    }
    const data = new FormData();
    for (const value of this.values) data.append(this.name, value);
    this.internals.setFormValue(this.name === '' ? null : data);
  }

  override render() {
    return html`<span part="label" ?hidden=${this.label === ''}>${this.label}</span>
      <div part="listbox" class="color-${colorRole(this.color)} ${this.multiple ? 'multiple' : ''}">
        <slot @slotchange=${() => this.requestUpdate()}></slot>
      </div>`;
  }

  #options(): MbOption[] {
    return [...this.children].filter((child): child is MbOption => child instanceof MbOption);
  }

  #describe(option: MbOption): ListboxItem {
    return {
      key: option.value,
      label: option.textContent?.trim() ?? '',
      disabled: option.disabled || this.disabled || this.matches(':disabled'),
    };
  }

  #defaultValues(): string[] {
    return this.#options()
      .filter((option) => option.defaultSelected)
      .map((option) => option.value);
  }

  #emitIfChanged(): void {
    const after = this.values;
    const changed = after.length !== this.#before.length || after.some((value) => !this.#before.includes(value));
    this.#before = after;
    if (!changed) return;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
```

`src/components/define/listbox.ts`:

```ts
import { MbListbox } from '../listbox/listbox.ts';
import { MbOption } from '../listbox/option.ts';
import { define } from '../shared/define.ts';

define('mb-option', MbOption);
define('mb-listbox', MbListbox);

declare global {
  interface HTMLElementTagNameMap {
    'mb-listbox': MbListbox;
    'mb-option': MbOption;
  }
}
```

`src/components/define/all.ts`:

```ts
import './accordion.ts';
import './button.ts';
import './dialog.ts';
import './disclosure.ts';
import './listbox.ts';
```

`src/components/index.ts`:

```ts
export { MbAccordion } from './accordion/accordion.ts';
export { MbButton, type ButtonType, type ButtonVariant } from './button/button.ts';
export { MbDialog } from './dialog/dialog.ts';
export { MbDisclosure } from './disclosure/disclosure.ts';
export { MbListbox } from './listbox/listbox.ts';
export { MbOption } from './listbox/option.ts';
export { colorRoles, type ColorRole } from './shared/color.ts';
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx web-test-runner --files test/browser/components/listbox.test.ts test/browser/components/conformance.test.ts && npm run typecheck && npm run lint`
Expected: 63 passed in each browser (10 component tests, 53 conformance tests: 6 disclosure, 8 dialog, 25 listbox, 14 accordion).

- [ ] **Step 5: Commit**

```bash
git add src/components/define/all.ts src/components/define/listbox.ts src/components/index.ts src/components/listbox/listbox.styles.ts src/components/listbox/listbox.ts src/components/listbox/option.styles.ts src/components/listbox/option.ts test/browser/components/conformance.test.ts test/browser/components/listbox.test.ts
git commit -m "Add mb-listbox and mb-option"
```

---

### Task 10: Styling contract tests

**Files:**
- `test/browser/components/styling.test.ts`

**Interfaces:**
- Consumes: every component (Tasks 5 to 9) and the role tokens (Task 1).
- This task adds tests for behavior the previous tasks built, so they pass on first run. Step 2 makes each one fail on purpose instead.

- [ ] **Step 1: Write the tests**

`test/browser/components/styling.test.ts`:

```ts
import { expect } from 'chai';
import { emulateMedia } from '@web/test-runner-commands';
import '../../../src/components/define/all.ts';
import { colorRoles, MbButton, type MbListbox } from '../../../src/components/index.ts';
import { define } from '../../../src/components/shared/define.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part, resolveColor, settle } from '../../support/components.ts';

const transparent = 'rgba(0, 0, 0, 0)';
const variants = ['default', 'outline', 'ghost'] as const;

describe('styling contract', () => {
  before(loadTokens);

  afterEach(async () => {
    document.body.replaceChildren();
    document.documentElement.removeAttribute('data-theme');
    await emulateMedia({ forcedColors: 'none' });
  });

  for (const role of colorRoles) {
    it(`mb-button uses the ${role} role tokens in each variant`, async () => {
      const { container } = await mount(
        variants.map((variant) => `<mb-button variant="${variant}" color="${role}">Go</mb-button>`).join(''),
      );
      const [solid, outline, ghost] = [...container.querySelectorAll('mb-button')].map((button) =>
        getComputedStyle(part(button, 'base')),
      ) as [CSSStyleDeclaration, CSSStyleDeclaration, CSSStyleDeclaration];
      expect(solid.backgroundColor, 'default background').to.equal(resolveColor(`--mb-color-${role}-solid`));
      expect(solid.color, 'default text').to.equal(resolveColor(`--mb-color-${role}-on-solid`));
      expect(outline.borderTopColor, 'outline border').to.equal(resolveColor(`--mb-color-${role}-border`));
      expect(outline.color, 'outline text').to.equal(resolveColor(`--mb-color-${role}-text`));
      expect(ghost.backgroundColor, 'ghost background').to.equal(transparent);
      expect(ghost.color, 'ghost text').to.equal(resolveColor(`--mb-color-${role}-text`));
    });

    it(`mb-listbox colors selected options with the ${role} role`, async () => {
      const { element } = await mount<MbListbox>(
        `<mb-listbox label="Fruit" color="${role}"><mb-option selected>Apple</mb-option></mb-listbox>`,
      );
      const base = getComputedStyle(part(element.querySelector('mb-option') as Element, 'base'));
      expect(base.backgroundColor).to.equal(resolveColor(`--mb-color-${role}-subtle`));
      expect(base.color).to.equal(resolveColor(`--mb-color-${role}-text`));
    });
  }

  it('follows the dark theme', async () => {
    document.documentElement.dataset['theme'] = 'dark';
    const { element } = await mount<MbButton>('<mb-button color="primary">Go</mb-button>');
    expect(getComputedStyle(part(element, 'base')).backgroundColor).to.equal(resolveColor('--mb-color-primary-solid'));
    expect(resolveColor('--mb-color-primary-solid')).to.equal('rgb(91, 147, 245)');
  });

  it('a component token set on an ancestor wins', async () => {
    const { container } = await mount('<div style="--mb-button-bg: rgb(1, 2, 3)"><mb-button>Go</mb-button></div>');
    const button = container.querySelector('mb-button') as MbButton;
    expect(getComputedStyle(part(button, 'base')).backgroundColor).to.equal('rgb(1, 2, 3)');
  });

  it('parts can be styled with ::part()', async () => {
    const style = document.createElement('style');
    style.textContent = 'mb-button.styled::part(base) { text-transform: uppercase; }';
    document.head.append(style);
    const { element } = await mount<MbButton>('<mb-button class="styled">Go</mb-button>');
    expect(getComputedStyle(part(element, 'base')).textTransform).to.equal('uppercase');
    style.remove();
  });

  it('keeps borders and selection visible in forced colors', async () => {
    await emulateMedia({ forcedColors: 'active' });
    const { container } = await mount(
      '<mb-button variant="ghost">Go</mb-button><mb-listbox label="Fruit"><mb-option selected>Apple</mb-option></mb-listbox>',
    );
    await settle(container);
    const button = container.querySelector('mb-button') as MbButton;
    const listbox = container.querySelector('mb-listbox') as MbListbox;
    expect(getComputedStyle(part(button, 'base')).borderTopStyle).to.equal('solid');
    expect(getComputedStyle(part(button, 'base')).borderTopColor).not.to.equal(transparent);
    const option = listbox.querySelector('mb-option') as Element;
    expect(getComputedStyle(part(option, 'base')).backgroundColor).not.to.equal(transparent);
  });

  for (const theme of ['light', 'dark']) {
    it(`every color and variant passes axe in the ${theme} theme`, async () => {
      document.documentElement.dataset['theme'] = theme;
      const buttons = colorRoles.flatMap((role) =>
        variants.map((variant) => `<mb-button variant="${variant}" color="${role}">${role} ${variant}</mb-button>`),
      );
      const listboxes = colorRoles.map(
        (role) => `<mb-listbox label="${role}" color="${role}"><mb-option selected>A</mb-option><mb-option>B</mb-option></mb-listbox>`,
      );
      const disclosures = colorRoles.map(
        (role) => `<mb-disclosure color="${role}" open><span slot="summary">${role}</span>Body</mb-disclosure>`,
      );
      // Components sit on the theme's surface, as they would on a themed page.
      const surface = 'background: var(--mb-color-bg-surface); color: var(--mb-color-fg-default)';
      const { container } = await mount(
        `<main style="${surface}">${[...buttons, ...listboxes, ...disclosures].join('')}</main>`,
      );
      await expectNoAxeViolations(container);
    });
  }

  it('define is safe to call again for a registered tag', () => {
    expect(() => {
      define('mb-button', class extends MbButton {});
    }).not.to.throw();
    expect(customElements.get('mb-button')).to.equal(MbButton);
  });
});
```

- [ ] **Step 2: Run the checks to verify everything passes**

Run: `npx web-test-runner --files test/browser/components/styling.test.ts`
Expected: 17 passed in each browser.

- [ ] **Step 3: Check that the tests can fail**

Temporarily replace, in `src/components/button/button.styles.ts`:

```ts
      color: var(--mb-button-fg, var(--_text));
      border-color: var(--mb-button-border-color, var(--_border));
```

with:

```ts
      color: var(--mb-button-fg, var(--_on-solid));
      border-color: var(--mb-button-border-color, var(--_border));
```

Rerun the previous step's command. Expected: each "mb-button uses the <role> role tokens in each variant" test fails on "outline text". Revert the change and rerun to green.

- [ ] **Step 4: Check that the tests can fail**

Temporarily replace, in `src/components/button/button.styles.ts`:

```ts
    @media (forced-colors: active) {
      [part='base'] {
        border-color: ButtonText;
      }
```

with:

```ts
    @media (forced-colors: active) {
      [part='base'] {
        border-color: transparent;
      }
```

Rerun the previous step's command. Expected: "keeps borders and selection visible in forced colors" fails. Revert the change and rerun to green.

- [ ] **Step 5: Commit**

```bash
git add test/browser/components/styling.test.ts
git commit -m "Test the styling contract across roles, variants, themes, and forced colors"
```

---

### Task 11: Package: manifest, size budgets, import check

**Files:**
- `test/unit/imports.test.ts`
- `custom-elements-manifest.config.js`
- `scripts/check-size.js`
- `package.json`
- `package-lock.json`
- `size-budget.json`

**Interfaces:**
- Produces: `dist/custom-elements.json` (built by `cem analyze` at the end of `npm run build`, referenced by `package.json` `customElements`, published with `dist`), version `0.2.0`, budgets for `match-box/components` and `match-box/components/define/all.js`.

- [ ] **Step 1: Write the tests**

`test/unit/imports.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

// Node has no window or document, so any DOM access at module scope throws here.
describe('entry points', () => {
  it.each([
    '../../src/core/index.ts',
    '../../src/core/state/index.ts',
    '../../src/core/dom/index.ts',
    '../../src/core/a11y/index.ts',
    '../../src/lit/index.ts',
    '../../src/components/index.ts',
  ])('%s imports without touching the DOM', async (path) => {
    expect(typeof globalThis.document).toBe('undefined');
    const module = (await import(path)) as object;
    expect(Object.keys(module).length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Implement**

Install the analyzer, then set the version, the manifest field, and the build step:

```bash
npm install -D @custom-elements-manifest/analyzer@^0.11.0
node -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
p.version = "0.2.0";
p.customElements = "dist/custom-elements.json";
p.scripts.build += " && cem analyze";
fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");'
```

`custom-elements-manifest.config.js`:

```js
export default {
  // The mixins are included so their attributes appear on the elements that use them.
  globs: ['src/components/**/*.ts', 'src/lit/form-associated.ts', 'src/lit/delegates-focus.ts'],
  exclude: ['src/components/**/*.styles.ts', 'src/components/define/**', 'src/components/shared/**', 'src/components/index.ts'],
  outdir: 'dist',
  litelement: true,
};
```

`scripts/check-size.js`:

```js
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
```

- [ ] **Step 3: Run the checks to verify everything passes**

Run: `npx vitest run && npm run build && node scripts/check-size.js --write && npm run size`
Expected: 39 unit tests pass; the build ends with `@custom-elements-manifest/analyzer: Created new manifest.`; every size row prints `ok`.

- [ ] **Step 4: Check tree-shaking**

Run:

```bash
echo "import { MbButton } from 'match-box/components';" | npx esbuild --bundle --minify --format=esm --external:lit --log-level=error | grep -c 'customElements.define'
echo "import 'match-box/components/define/button.js';" | npx esbuild --bundle --minify --format=esm --external:lit --log-level=error | grep -c 'customElements.define'
```

Expected: `0`, then `1`. Importing a class registers nothing and is tree-shaken; a define module survives bundling because it is listed in `sideEffects`. (The first `grep -c` exits 1 on zero matches; that is expected.)

- [ ] **Step 5: Commit**

```bash
git add custom-elements-manifest.config.js package-lock.json package.json scripts/check-size.js size-budget.json test/unit/imports.test.ts
git commit -m "Publish a custom-elements manifest and budget the component subpaths"
```

---

### Task 12: Docs: component pages, theming, styling contract

**Files:**
- `eleventy.config.js`
- `site/_data/elements.js`
- `site/_includes/api.njk`
- `site/_includes/layout.njk`
- `site/components/button.md`
- `site/components/disclosure.md`
- `site/components/accordion.md`
- `site/components/dialog.md`
- `site/components/listbox.md`
- `site/theming.md`
- `docs/styling-contract.md`
- `README.md`

**Interfaces:**
- Consumes: `dist/custom-elements.json` (Task 11) through `site/_data/elements.js`.
- The layout's import map resolves `match-box/components/` to `/pkg/components/` and `lit` and its three packages to `/vendor/`, copied from `node_modules`. Markdown now goes through Nunjucks (`markdownTemplateEngine: 'njk'`); the component pages list their tags under the front-matter key `api`, because Eleventy reserves `tags` for collections.
- [ ] **Step 1: Implement**

`eleventy.config.js`:

```js
export default function (eleventyConfig) {
  // The site consumes the built package exactly as a user would.
  eleventyConfig.addPassthroughCopy({ dist: 'pkg' });
  eleventyConfig.addPassthroughCopy('site/demos');
  // Lit for the component demos, served as ES modules through the import map.
  eleventyConfig.addPassthroughCopy({
    'node_modules/lit': 'vendor/lit',
    'node_modules/lit-html': 'vendor/lit-html',
    'node_modules/lit-element': 'vendor/lit-element',
    'node_modules/@lit/reactive-element': 'vendor/@lit/reactive-element',
  });
  return { dir: { input: 'site', output: '_site' }, markdownTemplateEngine: 'njk' };
}
```

`site/_data/elements.js`:

```js
// Component API data, generated from source by `cem analyze` during `npm run build`.
import { readFileSync } from 'node:fs';

export default function () {
  const manifest = JSON.parse(readFileSync(new URL('../../dist/custom-elements.json', import.meta.url), 'utf8'));
  const elements = {};
  for (const module of manifest.modules) {
    for (const declaration of module.declarations ?? []) {
      if (declaration.tagName) elements[declaration.tagName] = declaration;
    }
  }
  return elements;
}
```

`site/_includes/api.njk`:

```html
{% for tag in api %}
{% set el = elements[tag] %}
<h2 id="{{ tag }}-api"><code>&lt;{{ tag }}&gt;</code></h2>
<p>{{ el.description }}</p>
{% if el.attributes and el.attributes.length %}
<h3>Attributes</h3>
<table>
  <thead><tr><th>Attribute</th><th>Property</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
  <tbody>
  {% for a in el.attributes %}
    <tr><td><code>{{ a.name }}</code></td><td><code>{{ a.fieldName }}</code></td><td><code>{{ a.type.text }}</code></td><td><code>{{ a.default }}</code></td><td>{{ a.description }}</td></tr>
  {% endfor %}
  </tbody>
</table>
{% endif %}
{% set fields = [] %}{% set methods = [] %}
{% for m in el.members %}{% if not m.static and m.privacy != 'private' and m.privacy != 'protected' %}{% if m.kind == 'method' %}{% set methods = (methods.push(m), methods) %}{% elif not m.attribute %}{% set fields = (fields.push(m), fields) %}{% endif %}{% endif %}{% endfor %}
{% if fields.length %}
<h3>Properties</h3>
<table>
  <thead><tr><th>Property</th><th>Type</th><th>Description</th></tr></thead>
  <tbody>{% for m in fields %}<tr><td><code>{{ m.name }}</code></td><td><code>{{ m.type.text }}</code></td><td>{{ m.description }}</td></tr>{% endfor %}</tbody>
</table>
{% endif %}
{% if methods.length %}
<h3>Methods</h3>
<table>
  <thead><tr><th>Method</th><th>Description</th></tr></thead>
  <tbody>{% for m in methods %}<tr><td><code>{{ m.name }}({% for p in m.parameters %}{{ p.name }}{% if not loop.last %}, {% endif %}{% endfor %})</code></td><td>{{ m.description }}</td></tr>{% endfor %}</tbody>
</table>
{% endif %}
{% for section in [['Events', el.events], ['Slots', el.slots], ['Parts', el.cssParts], ['Custom states', el.cssStates], ['Component tokens', el.cssProperties]] %}
{% if section[1] and section[1].length %}
<h3>{{ section[0] }}</h3>
<table>
  <thead><tr><th>Name</th><th>Description</th></tr></thead>
  <tbody>{% for item in section[1] %}<tr><td><code>{{ item.name or '(default)' }}</code></td><td>{{ item.description }}</td></tr>{% endfor %}</tbody>
</table>
{% endif %}
{% endfor %}
{% endfor %}
```

`site/_includes/layout.njk`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ title }} · match-box</title>
    <link rel="stylesheet" href="/pkg/tokens/tokens.css" />
    <script type="importmap">
      {
        "imports": {
          "match-box/core": "/pkg/core/index.js",
          "match-box/components": "/pkg/components/index.js",
          "match-box/components/": "/pkg/components/",
          "lit": "/vendor/lit/index.js",
          "lit/": "/vendor/lit/",
          "lit-html": "/vendor/lit-html/lit-html.js",
          "lit-html/": "/vendor/lit-html/",
          "lit-element/": "/vendor/lit-element/",
          "@lit/reactive-element": "/vendor/@lit/reactive-element/reactive-element.js",
          "@lit/reactive-element/": "/vendor/@lit/reactive-element/"
        }
      }
    </script>
    <script type="module" src="/pkg/components/define/all.js"></script>
    <style>
      body {
        margin: 0 auto;
        max-width: 48rem;
        padding: var(--mb-space-stack-lg) var(--mb-space-inline-lg);
        font: var(--mb-font-size-body) / var(--mb-line-height-body) var(--mb-font-family-body);
        color: var(--mb-color-fg-default);
        background: var(--mb-color-bg-canvas);
      }
      .demo {
        padding: var(--mb-space-stack-lg) var(--mb-space-inline-lg);
        background: var(--mb-color-bg-surface);
        border: 1px solid var(--mb-color-border-default);
        border-radius: var(--mb-radius-surface);
      }
      .demo div[role='option'][aria-selected='true'] {
        background: var(--mb-color-primary-subtle);
        color: var(--mb-color-primary-text);
      }
      .demo > * + * {
        margin-block-start: var(--mb-space-stack-md);
      }
      .row {
        display: flex;
        flex-wrap: wrap;
        gap: var(--mb-space-inline-sm);
      }
      table {
        border-collapse: collapse;
        inline-size: 100%;
      }
      th,
      td {
        padding: var(--mb-space-stack-sm) var(--mb-space-inline-sm);
        border-block-end: 1px solid var(--mb-color-border-default);
        text-align: start;
        vertical-align: top;
      }
      .demo div[role='option'][aria-disabled='true'] {
        color: var(--mb-color-fg-disabled);
      }
      :focus-visible {
        outline: var(--mb-focus-ring-width) solid var(--mb-color-border-focus);
      }
    </style>
  </head>
  <body>
    <nav><a href="/">match-box</a> · <a href="/patterns/listbox/">Listbox</a> ·
      <a href="/patterns/disclosure/">Disclosure</a> · <a href="/patterns/dialog/">Dialog</a> ·
      <a href="/api/">API</a> · Components: <a href="/components/button/">Button</a> ·
      <a href="/components/disclosure/">Disclosure</a> · <a href="/components/accordion/">Accordion</a> ·
      <a href="/components/dialog/">Dialog</a> · <a href="/components/listbox/">Listbox</a> ·
      <a href="/theming/">Theming</a></nav>
    <main>{{ content | safe }}</main>
  </body>
</html>
```

`site/components/button.md`:

````md
---
layout: layout.njk
title: Button
api: [mb-button]
---

# Button

```js
import 'match-box/components/define/button.js';
```

<div class="demo">
  <div class="row">
    <mb-button>Neutral</mb-button>
    <mb-button color="primary">Primary</mb-button>
    <mb-button color="secondary">Secondary</mb-button>
    <mb-button color="tertiary">Tertiary</mb-button>
    <mb-button color="danger">Danger</mb-button>
  </div>
  <div class="row">
    <mb-button variant="outline">Neutral</mb-button>
    <mb-button variant="outline" color="primary">Primary</mb-button>
    <mb-button variant="outline" color="secondary">Secondary</mb-button>
    <mb-button variant="outline" color="tertiary">Tertiary</mb-button>
    <mb-button variant="outline" color="danger">Danger</mb-button>
  </div>
  <div class="row">
    <mb-button variant="ghost">Neutral</mb-button>
    <mb-button variant="ghost" color="primary">Primary</mb-button>
    <mb-button variant="ghost" color="secondary">Secondary</mb-button>
    <mb-button variant="ghost" color="tertiary">Tertiary</mb-button>
    <mb-button variant="ghost" color="danger">Danger</mb-button>
  </div>
  <div class="row"><mb-button disabled>Disabled</mb-button></div>
</div>

```html
<mb-button variant="outline" color="primary">Save</mb-button>
<form>
  <mb-button type="submit" color="primary">Send</mb-button>
  <mb-button type="reset" variant="ghost">Reset</mb-button>
</form>
```

`variant` sets the structure and `color` the color role; any pair works.

{% include "api.njk" %}
````

`site/components/disclosure.md`:

````md
---
layout: layout.njk
title: Disclosure
api: [mb-disclosure]
---

# Disclosure

```js
import 'match-box/components/define/disclosure.js';
```

<div class="demo">
  <mb-disclosure>
    <span slot="summary">Shipping details</span>
    Orders ship within two business days.
  </mb-disclosure>
  <mb-disclosure color="primary" open>
    <span slot="summary">Returns</span>
    Return any item within 30 days.
  </mb-disclosure>
</div>

```html
<mb-disclosure open>
  <span slot="summary">Shipping details</span>
  Orders ship within two business days.
</mb-disclosure>
```

{% include "api.njk" %}
````

`site/components/accordion.md`:

````md
---
layout: layout.njk
title: Accordion
api: [mb-accordion]
---

# Accordion

```js
import 'match-box/components/define/accordion.js';
```

<div class="demo">
  <mb-accordion>
    <mb-disclosure><span slot="summary">Shipping</span>Orders ship within two business days.</mb-disclosure>
    <mb-disclosure><span slot="summary">Returns</span>Return any item within 30 days.</mb-disclosure>
    <mb-disclosure><span slot="summary">Warranty</span>Two years on all hardware.</mb-disclosure>
  </mb-accordion>
</div>

```html
<mb-accordion multiple heading-level="2">
  <mb-disclosure><span slot="summary">Shipping</span>…</mb-disclosure>
  <mb-disclosure><span slot="summary">Returns</span>…</mb-disclosure>
</mb-accordion>
```

Opening one disclosure closes the others unless `multiple` is set. Each
trigger sits in a heading, level 3 by default.

{% include "api.njk" %}
````

`site/components/dialog.md`:

````md
---
layout: layout.njk
title: Dialog
api: [mb-dialog]
---

# Dialog

```js
import 'match-box/components/define/dialog.js';
```

<div class="demo">
  <mb-button color="danger" id="open-dialog">Delete project</mb-button>
  <mb-dialog label="Delete project?" color="danger" id="demo-dialog">
    <p>This removes the project and its history.</p>
    <form method="dialog" slot="footer">
      <mb-button type="submit" variant="ghost">Cancel</mb-button>
      <button value="delete">Delete</button>
    </form>
  </mb-dialog>
  <p>Returned: <output id="dialog-result"></output></p>
</div>
<script type="module">
  const dialog = document.getElementById('demo-dialog');
  document.getElementById('open-dialog').addEventListener('click', () => dialog.show());
  dialog.addEventListener('close', () => {
    document.getElementById('dialog-result').value = dialog.returnValue || '(dismissed)';
  });
</script>

```html
<mb-dialog label="Delete project?" color="danger">
  <p>This removes the project and its history.</p>
  <form method="dialog" slot="footer">
    <button value="delete">Delete</button>
  </form>
</mb-dialog>
```

A `<form method="dialog">` inside closes the dialog with the submit
button's `value` as `returnValue`. A dismissal (Escape, outside click, the
close button) leaves `returnValue` empty.

{% include "api.njk" %}
````

`site/components/listbox.md`:

````md
---
layout: layout.njk
title: Listbox
api: [mb-listbox, mb-option]
---

# Listbox

```js
import 'match-box/components/define/listbox.js';
```

<div class="demo">
  <mb-listbox label="Fruit" color="primary">
    <mb-option>Apple</mb-option>
    <mb-option selected>Banana</mb-option>
    <mb-option disabled>Cherry</mb-option>
    <mb-option>Date</mb-option>
  </mb-listbox>
  <mb-listbox label="Toppings" multiple color="tertiary">
    <mb-option value="nuts">Nuts</mb-option>
    <mb-option value="honey" selected>Honey</mb-option>
    <mb-option value="yogurt">Yogurt</mb-option>
  </mb-listbox>
</div>

```html
<form>
  <mb-listbox label="Toppings" name="toppings" multiple required>
    <mb-option value="nuts">Nuts</mb-option>
    <mb-option value="honey" selected>Honey</mb-option>
  </mb-listbox>
</form>
```

With `multiple`, the form gets one `toppings` entry per selected option.
An option's `value` defaults to its text.

{% include "api.njk" %}
````

`site/theming.md`:

````md
---
layout: layout.njk
title: Theming
---

# Theming

Every component takes a `color`: `neutral` (default), `primary`,
`secondary`, `tertiary`, or `danger`. Each role is six tokens, and every
component and variant reads them:

| Token | Used for |
|---|---|
| `--mb-color-<role>-solid` | Filled backgrounds |
| `--mb-color-<role>-solid-hover` | Filled backgrounds on hover |
| `--mb-color-<role>-on-solid` | Text and icons on `solid` |
| `--mb-color-<role>-text` | Text on a surface |
| `--mb-color-<role>-subtle` | Tinted backgrounds: hover, selected options |
| `--mb-color-<role>-border` | Outlines |

<div class="demo">
  <div class="row">
    <mb-button color="primary">Primary</mb-button>
    <mb-button color="secondary">Secondary</mb-button>
    <mb-button color="tertiary">Tertiary</mb-button>
    <mb-button color="danger">Danger</mb-button>
  </div>
  <div class="row brand">
    <mb-button color="primary">Rebranded primary</mb-button>
    <mb-button color="primary" variant="outline">Rebranded primary</mb-button>
  </div>
</div>
<style>
  .brand {
    --mb-color-primary-solid: #b3261e;
    --mb-color-primary-solid-hover: #8c1d18;
    --mb-color-primary-on-solid: #ffffff;
    --mb-color-primary-text: #b3261e;
    --mb-color-primary-subtle: #fceeee;
    --mb-color-primary-border: #b3261e;
  }
</style>

## Set a role for your brand

Override the six tokens once, on `:root` or any subtree. Define light and
dark values; keep `on-solid` and `text` at 4.5:1 or more against their
backgrounds, and `border` at 3:1 against the surface.

```css
:root {
  --mb-color-primary-solid: #b3261e;
  --mb-color-primary-solid-hover: #8c1d18;
  --mb-color-primary-on-solid: #ffffff;
  --mb-color-primary-text: #b3261e;
  --mb-color-primary-subtle: #fceeee;
  --mb-color-primary-border: #b3261e;
}
```

## Adjust one component

Component tokens override a single component, on the element or any
ancestor: `mb-button { --mb-button-radius: 999px; }`. Each component page
lists its tokens. For anything else, style its parts:
`mb-dialog::part(title) { font-size: 1.5rem; }`.

## Light and dark

Set `data-theme="light"` or `data-theme="dark"` on any element. Without
it, the page follows the system preference.
````

`docs/styling-contract.md`:

```md
# Styling contract for the match-box skin

Status: v2 step 1. `match-box/components` implements this contract for
button, disclosure, accordion, dialog, and listbox.

## Customization surfaces

Use them in this order. Each one is part of the public API and follows
semver.

1. **Tokens.** Every visual property of a component reads a component token,
   such as `--mb-button-bg`, which defaults to a color role or other
   semantic token, such as `--mb-color-primary-solid`. Consumers override
   component tokens per subtree and semantic tokens per theme. Components
   never declare their component tokens on `:host`, so a value set on any
   ancestor applies.
2. **Parts.** Each component exposes a documented, stable set of `part`
   names. Adding a part is a minor version. Removing or renaming one is a
   major version.
3. **Slots.** Named slots accept consumer content and always have default
   content.

A consumer who needs a different structure uses `match-box/core` directly
and renders their own markup. The skin ships no `unstyled` attribute and no
global style injection.

## Color roles and variants

Two independent attributes:

- **`color`** picks a color role: `neutral` (default), `primary`,
  `secondary`, `tertiary`, or `danger`. Each role is six semantic tokens,
  `--mb-color-<role>-solid`, `-solid-hover`, `-on-solid`, `-text`,
  `-subtle`, and `-border`. A theme defines each role once; every
  component and variant follows.
- **`variant`** picks a structure, only on components whose structure
  varies. `mb-button`: `default` (filled), `outline`, `ghost`.

Any `variant` combines with any `color`. Contrast per role and theme:
`on-solid` on `solid` and `solid-hover`, and `text` on the surface and on
`subtle`, at least 4.5:1; `border` on the surface at least 3:1.

The color roles replace these v1 tokens (removed in `0.2.0`):

| v1 token | Use instead |
|---|---|
| `--mb-color-bg-accent` | `--mb-color-primary-solid` |
| `--mb-color-bg-accent-hover` | `--mb-color-primary-solid-hover` |
| `--mb-color-fg-on-accent` | `--mb-color-primary-on-solid` |
| `--mb-color-fg-accent` | `--mb-color-primary-text` |
| `--mb-color-bg-danger` | `--mb-color-danger-solid` |
| `--mb-color-fg-danger` | `--mb-color-danger-text` |
| `--mb-color-border-danger` | `--mb-color-danger-border` |

## Rules for every component

- Shadow DOM, always.
- `delegatesFocus` on any component that contains a focusable element, via
  the `DelegatesFocus` mixin.
- State is reflected through attributes and custom states (`:state(...)`),
  so parts can be styled by condition. The core behaviors write only ARIA
  attributes and `tabindex`; styling hooks come from the template. A
  template may write static ARIA the core never writes: `role="heading"`
  and `aria-level` around a disclosure trigger, `aria-hidden` on a
  decorative icon.
- A `:focus-visible` ring on every focusable part, from
  `--mb-focus-ring-width` and `--mb-color-border-focus`, and an
  `@media (forced-colors: active)` block that keeps borders, selection, and
  focus visible.
- No `size` attribute in the first skin release.
- No `margin` on the host element. Layout belongs to the consumer.
- Icons come through a slot. No icon set is bundled.

## Attributes the core writes

Templates must not write these, and styles may select on them.

| Behavior | Element | Attributes |
|---|---|---|
| `attachListbox` | root | `role`, `aria-multiselectable`, `ariaLabelledByElements` |
| `attachListbox` | option | `role`, `aria-selected`, `aria-disabled`, `tabindex` |
| `attachDisclosure` | trigger | `aria-expanded`, `ariaControlsElements`, and `role`, `tabindex` when not a `<button>` |
| `attachDialog` | dialog | `ariaLabelledByElements` |
| `mb-listbox` (via `attachListbox`) | `mb-option` | `role`, `aria-selected`, `aria-disabled`, `tabindex` |
```

`README.md`:

````md
# match-box

A design system built on Lit whose accessible behaviors do not depend on Lit.
The headless core works from plain HTML, any framework, or Lit; Lit is the
first adapter, not the foundation.

It ships design tokens with five color roles, the headless core (listbox,
disclosure, accordion, and native dialog behaviors), the Lit adapter
(controllers plus `FormAssociated` and `DelegatesFocus` mixins),
conformance test suites, and styled components: `mb-button`,
`mb-disclosure`, `mb-accordion`, `mb-dialog`, `mb-listbox`.

## Install

```sh
npm install match-box
```

| Import | Contents |
|---|---|
| `match-box/core` | State classes, `attachX` DOM behaviors, accessibility utilities |
| `match-box/core/testing` | Conformance suites for Mocha and Chai (needs `chai`) |
| `match-box/lit` | Reactive controllers and mixins (needs `lit`) |
| `match-box/components` | Component classes, unregistered (needs `lit`) |
| `match-box/components/define/<name>.js` | Registers `<mb-name>` (and what it needs); `all.js` registers everything |
| `match-box/tokens.css` | Light and dark design tokens |

```html
<script type="module">
  import 'match-box/components/define/all.js';
</script>
<link rel="stylesheet" href="node_modules/match-box/dist/tokens/tokens.css" />

<mb-listbox label="Fruit" name="fruit">
  <mb-option>Apple</mb-option>
  <mb-option selected>Banana</mb-option>
</mb-listbox>
<mb-button color="primary" variant="outline">Save</mb-button>
```

Or use the headless core directly:

```js
import { attachListbox } from 'match-box/core';

const { state, dispose } = attachListbox({ root, label, items: () => [...root.children] });
state.subscribe(() => console.log([...state.selected]));
```

Browser support: the last two versions of evergreen browsers. No polyfills.

## Develop

```sh
npm install
npx playwright install chromium firefox webkit
npm test          # unit tests in Node, browser tests in Chromium, Firefox, WebKit
npm run lint
npm run typecheck
npm run size      # bundle size per subpath against size-budget.json
npm run docs      # builds the site into _site
```

Design: [docs/superpowers/specs/2026-09-18-match-box-design.md](docs/superpowers/specs/2026-09-18-match-box-design.md).
Styling contract for the future skin: [docs/styling-contract.md](docs/styling-contract.md).

## License

MIT
````

- [ ] **Step 2: Run the checks to verify everything passes**

Run: `rm -rf _site && npm run docs`
Expected: Eleventy writes 10 files; `_site/components` holds `accordion button dialog disclosure listbox`; `_site/vendor` holds `@lit lit lit-element lit-html`; TypeDoc reports no errors.

- [ ] **Step 3: Check the site in a browser**

Run `npx @11ty/eleventy --serve` and open `http://localhost:8080/components/listbox/`: every `mb-` element renders, clicking **Date** selects it, and the console shows no errors. On `/components/dialog/`, open the dialog and press **Delete**: the page shows `Returned: delete`. Check that every component page shows its API tables.

- [ ] **Step 4: Run every gate**

Run: `npm run typecheck && npm run lint && npm test && npm run size && rm -rf _site && npm run docs`
Expected: every command exits 0; 39 unit tests, and 289 browser tests in each of Chromium, Firefox, and WebKit.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/styling-contract.md eleventy.config.js site/_data/elements.js site/_includes/api.njk site/_includes/layout.njk site/components/accordion.md site/components/button.md site/components/dialog.md site/components/disclosure.md site/components/listbox.md site/theming.md
git commit -m "Document the components and theming"
```
