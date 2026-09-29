# match-box Storybook and GitHub Pages

Date: 2026-09-28
Status: approved for planning
Builds on: `docs/superpowers/specs/2026-09-28-match-box-0.4.0-motion-design.md`

## 1. Purpose and scope

match-box has an Eleventy guide and a TypeDoc API reference, both built in
CI and published nowhere. This work adds Storybook as an interactive
playground and publishes all three on GitHub Pages, before the `0.5.0`
form controls.

| Path on `https://heartlex.github.io/match-box/` | Content | Tool |
|---|---|---|
| `/` | Written guide | Eleventy (kept) |
| `/api/` | API reference | TypeDoc (kept) |
| `/storybook/` | Interactive playground | Storybook (new) |

Success means:

- every styled component, headless pattern, and motion helper has stories,
  with controls read from the element manifest;
- a Theme toolbar (system, light, dark) and a Motion toolbar (on, off)
  apply to every story;
- CI fails when a story throws, renders nothing, or has an axe violation,
  in either theme;
- pushing a `v*` tag publishes the site, and every local URL in it works
  under `/match-box/`.

### Non-goals

- Replacing Eleventy. It stays the written guide.
- Interaction tests in stories (play functions). Behavior stays tested by
  web-test-runner.
- `@storybook/addon-vitest` (needs Vitest 4; the repo is on Vitest 5) and
  `@storybook/test-runner` (adds Jest).
- Versioned docs (a build per release). The site shows the latest tag.
- Visual-regression screenshots.
- A package release. `package.json`'s version and `CHANGELOG.md` do not
  change; the published package is identical.

## 2. Storybook setup

### Dependencies

Dev dependencies only: `storybook`, `@storybook/web-components-vite`,
`@storybook/addon-docs`, `@storybook/addon-a11y` (all the current major,
10), and `vite` (a peer of the framework). The smoke test uses `playwright`
and `axe-core`, already dev dependencies.

### Files

| File | Responsibility |
|---|---|
| `.storybook/main.ts` | Framework `@storybook/web-components-vite`; addons docs and a11y; stories `stories/**/*.mdx` and `stories/**/*.stories.ts`, plus `stories/__smoke__/**` only when `STORYBOOK_SMOKE_FIXTURE=1` |
| `.storybook/preview.ts` | Loads `src/tokens/tokens.css`; registers every element via `dist/components/define/all.js`, the built package as users import it; passes `dist/custom-elements.json` to `setCustomElementsManifest`; declares the Theme and Motion toolbar globals and the decorator that applies them |
| `stories/` | Stories and MDX pages (section 3) |

- Stories live outside `src/`, so they never reach `dist`, the element
  manifest, or TypeDoc. `tsconfig.json`'s `include` and ESLint cover
  `stories` and `.storybook`, so they are typechecked and linted.
- The elements come from the built package, so component changes appear in
  the dev server after `npm run build`. Motion stories import the helpers
  from `src/`. `demos.js` is imported from `site/demos/`.
- `storybook-static/` is added to `.gitignore` and to ESLint's ignores.

### Scripts

| Script | Command |
|---|---|
| `storybook` | `npm run build && storybook dev -p 6006` |
| `storybook:build` | `npm run build && storybook build -o storybook-static` |
| `storybook:smoke` | `node scripts/storybook-smoke.js storybook-static` |
| `storybook:smoke:self-test` | builds with `STORYBOOK_SMOKE_FIXTURE=1` into `storybook-smoke-fixture/` and runs `node scripts/storybook-smoke.js storybook-smoke-fixture --expect-fail smoke-fixture--throws` |

`npm run build` comes first because the manifest is generated there.
`storybook-smoke-fixture/` is also ignored by git and ESLint.

## 3. Stories

### Sidebar

| Title | Content |
|---|---|
| `Introduction` | MDX: what match-box is; links to the guide (`../`) and the API (`../api/`) |
| `Components/Button` | Playground; Variants; Colors; Sizes; Link; Disabled |
| `Components/Disclosure` | Playground; Open; Sizes |
| `Components/Accordion` | Playground; Single; Multiple; Sized |
| `Components/Dialog` | Playground; Trigger; Sizes |
| `Components/Listbox` | Playground; Single; Multiple; Disabled options; Sizes |
| `Patterns/Listbox`, `Patterns/Disclosure`, `Patterns/Dialog` | One story each, calling `mountListbox`, `mountDisclosure`, `mountDialog` from `site/demos/demos.js` |
| `Motion/Reveal`, `Motion/Stagger`, `Motion/Flip`, `Motion/Exit` | One interactive story each |

- Component stories use `tags: ['autodocs']`, so each component has a docs
  page with the manifest's attributes, properties, slots, parts, events,
  and CSS properties.
- Playground stories have a control per attribute the manifest lists and
  render the element from the args.
- Showcase stories mirror the Eleventy demos: fixed markup, no controls.
- Dialog stories render a trigger `mb-button` that calls `show()`; no story
  opens a dialog on load.
- Motion stories have controls `duration` (`fast`, `medium`, `slow`, or a
  number), `easing` (the four names), and `interval` (number), and a
  Replay button. Flip and Exit reuse the Motion page's list (Add, Shuffle,
  Remove, focus moved to a neighbor before an exit). Reveal renders a
  column taller than the story frame and reveals its cards as it scrolls.
- Format: CSF3 in TypeScript, rendering with Lit's `html`, typed with
  `Meta` and `StoryObj` from `@storybook/web-components-vite`.

### Toolbar

| Global | Values | Effect |
|---|---|---|
| `theme` | `system` (default), `light`, `dark` | The decorator wraps the story in a `div` with `data-theme` (none for `system`), `background: var(--mb-color-bg-canvas)`, `color: var(--mb-color-fg-default)`, and padding |
| `motion` | `on` (default), `off` | `off` sets `--mb-motion-duration-fast`, `-medium`, and `-slow` to `0ms` on the wrapper, as `tokens.css` does under reduced motion |

The toolbar cannot emulate `prefers-reduced-motion`; `off` is the
token-level equivalent and says so in its tooltip.

## 4. Smoke test

`scripts/storybook-smoke.js <dir> [--expect-fail <story-id>]`:

1. Serves `<dir>` with a static file server built on `node:http`, on a
   free port.
2. Reads `<dir>/index.json` and keeps entries with `type: 'story'`.
3. For each story and each theme (`light`, `dark`), opens
   `iframe.html?id=<id>&viewMode=story&globals=theme:<theme>;motion:off`
   in Playwright Chromium.
4. The story fails when:
   - the page emits `pageerror` or a `console` message of type `error`;
   - Storybook shows its error display (`body.sb-show-errordisplay`);
   - `#storybook-root` has no child within 5 s;
   - axe-core, injected into the page and run on `#storybook-root` with
     the tags of `test/support/axe.ts` (`wcag2a`, `wcag2aa`, `wcag21a`,
     `wcag21aa`, `wcag22aa`), reports a violation.
5. Prints `ok   <id> [<theme>]` or `FAIL <id> [<theme>]: <reason>` per run,
   and exits 1 if any run failed.

With `--expect-fail <id>`, the script inverts for that story: it exits 1
unless that story failed in both themes and every other story passed. The
fixture `stories/__smoke__/throws.stories.ts` (title `Smoke fixture`,
story `Throws`, id `smoke-fixture--throws`) throws from its render
function; it is included only when `STORYBOOK_SMOKE_FIXTURE=1`. This
proves the smoke test can fail.

Motion runs off so axe never checks a frame mid-animation. Dialogs are
checked closed; open dialogs are covered by web-test-runner's axe tests.

## 5. CI

`.github/workflows/ci.yml`, job `check`, after `npm run docs`:

```yaml
      - run: npm run docs:prefix-check
      - run: npm run storybook:build
      - run: npm run storybook:smoke
      - run: npm run storybook:smoke:self-test
```

Chromium is already installed in that job.

## 6. GitHub Pages

### Base path

The site is served under `/match-box/`. Today Eleventy writes absolute
URLs (`/pkg/…`, `/vendor/…`, `/components/…`, and links in Markdown).

- `eleventy.config.js` reads `pathPrefix` from `ELEVENTY_PATH_PREFIX`,
  default `/`, and adds Eleventy's `HtmlBasePlugin`, which rewrites `href`
  and `src` in the generated HTML.
- The import map in `site/_includes/layout.njk` is JSON inside a
  `<script>`, which the plugin does not rewrite; each entry goes through
  the `htmlBaseUrl` filter explicitly.
- The nav gains a `Storybook` link to `/storybook/`.
- `scripts/check-site-prefix.js <dir> <prefix>` scans every generated
  HTML file and exits 1, listing file and URL, when an `href`, `src`, or
  import-map URL starts with `/` but not `<prefix>`. External and relative
  URLs and in-page anchors are ignored. The script `docs:prefix-check`
  builds the Eleventy site with `ELEVENTY_PATH_PREFIX=/match-box/` into
  `_site-prefix-check/` (ignored by git and ESLint) and runs the check on
  it. It needs `dist/`, so it runs after `npm run docs`.
- TypeDoc output (`/api/`) uses relative links and is not rewritten.
- Storybook's static build uses relative paths and works under any prefix.

### Workflow

`.github/workflows/pages.yml`:

| Part | Value |
|---|---|
| Triggers | `push` of tags `v*`; `workflow_dispatch` |
| Permissions | `contents: read`, `pages: write`, `id-token: write` |
| Concurrency | group `pages`, `cancel-in-progress: false` |
| Job `build` | checkout; Node 24 with npm cache; `npm ci`; `ELEVENTY_PATH_PREFIX=/match-box/ npm run docs`; `npm run storybook:build`; copy `storybook-static/` to `_site/storybook/`; `actions/configure-pages`; `actions/upload-pages-artifact` with `path: _site` |
| Job `deploy` | needs `build`; environment `github-pages` with the deployment URL; `actions/deploy-pages` |

Tests do not run here: tags are cut from `main`, which CI has checked.

### One-time setup

Pages is enabled with source "GitHub Actions" — a repository setting,
changed by the user or by `gh api` as heartlex with the user's approval.
Enabling it creates the `github-pages` environment, whose default
deployment policy allows only the default branch; a `v*` tag rule is added
to it (Settings → Environments → github-pages, or
`gh api -X POST repos/heartlex/match-box/environments/github-pages/deployment-branch-policies -f name='v*' -f type=tag`),
or tag pushes build but fail to deploy.

### First publish

`v0.4.0` has no `pages.yml`, so a manual run cannot use it. After this
work merges, the first publish is a manual run on `main` (its package is
identical to `v0.4.0`). From `v0.5.0`, tags publish automatically.

## 7. Docs

- `README.md`: a link to the published site, and the Storybook scripts in
  its development section.
- `site/index.md`: links to Storybook and the API.

## 8. Testing summary

| What | How |
|---|---|
| Stories render, throw nothing, and pass axe in both themes | `storybook:smoke` in CI |
| The smoke test can fail | `storybook:smoke:self-test` in CI |
| Every local URL works under `/match-box/` | `docs:prefix-check` in CI; the check script is itself run once against a build without the prefix, where it must fail |
| Local docs unchanged | `npm run docs` and the existing demos test, with the default prefix |
| Deploy | A manual run of `pages.yml` after merge; the published pages load, with no console errors, at all three paths |

## 9. Decisions log

| Decision | Alternatives rejected | Reason |
|---|---|---|
| Keep Eleventy; add Storybook beside it | Replace Eleventy; Storybook first, decide later | Requested; the guide's prose and patterns read better as Markdown |
| All four story groups plus the toolbar | Components only | Requested; the patterns reuse `demos.js`, so they cost little |
| Stories in `stories/`, importing `src/` | Colocated in `src/`; importing `dist/` | Keeps them out of the package and the manifest; live reload |
| Controls from `custom-elements.json` | Hand-written `argTypes` | One source of truth with the Eleventy API tables |
| Own smoke script (Playwright + axe-core) | `@storybook/test-runner`; `addon-vitest` | No second test framework; `addon-vitest` needs Vitest 4 |
| Motion off and both themes in the smoke test | One theme; motion on | Mid-animation frames can fail contrast; dark mode has its own colors |
| A fixture story that must fail | Trusting the script | A smoke test that always passes would go unnoticed |
| Publish on `v*` tags | Every push to `main`; versioned builds | The site matches the released package; no `gh-pages` branch to maintain |
| Path prefix from an environment variable | Hard-coded `/match-box/` | Local `docs` and `--serve` keep working at `/` |
