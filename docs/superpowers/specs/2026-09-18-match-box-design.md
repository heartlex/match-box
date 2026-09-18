# match-box design system: v1 design

Date: 2026-09-18
Status: approved for planning

## 1. Purpose and positioning

match-box is a public, open-source design system built on Lit. Its
distinguishing feature is a headless behavior layer that does not depend on
Lit or any framework. Lit is the first adapter, not the foundation.

Audience, in priority order:

1. The author's own Lit applications, which consume the headless layer
   directly.
2. Teams on any framework (React, Vue, Angular, plain HTML), who consume the
   styled web components (v2) or the framework-agnostic DOM behaviors (v1).
3. The open-source community, which requires strong docs, semver discipline,
   and predictable customization surfaces.

The primitives are owned, not delegated. Zag.js and similar libraries were
considered and rejected: the behavior layer is the product.

### v1 scope

Foundations only. No styled components ship in v1.

- Token pipeline with light and dark themes and a density axis.
- Headless core: four behavior patterns proven across three layers.
- Lit adapter: controllers and two mixins.
- Conformance test suites that any implementation can run.
- Styling contract for the future skin, documented but not implemented.

### v1 non-goals

- Styled components (v2).
- React wrappers (v2).
- Popover positioning or anchoring (v2).
- Multi-brand theming, runtime theme generation, palette from seed color.
- Bundled icon set.
- Polyfills for browsers older than the stated baseline.

## 2. Packages

Monorepo with pnpm workspaces and Changesets. Four packages in v1.

| Package | Contents | Depends on |
|---|---|---|
| `@match-box/tokens` | W3C Design Tokens JSON source; built CSS and a typed TS module. No runtime code. | nothing |
| `@match-box/core` | Headless layer. Subpaths `core/state`, `core/dom`, `core/a11y`, `core/testing`. Zero dependencies. | nothing |
| `@match-box/lit` | Reactive controllers wrapping `core/dom`; `FormAssociated` and `DelegatesFocus` mixins. The only package that imports Lit. | `core`, `lit` |
| `@match-box/components` | Empty in v1 except a README containing the styling contract (section 6). | `core`, `lit`, `tokens` |

Boundary rules:

- Dependency direction is strictly upward: `tokens` and `core` at the bottom,
  `lit` above `core`, `components` above all. No cycles. Enforced by an ESLint
  rule.
- Every package ships ESM only, with an `exports` map and
  `sideEffects: false`.
- Custom element registration happens only in `components`. `core` and `lit`
  never call `customElements.define`.
- One shared `tsconfig` base with `strict`, `exactOptionalPropertyTypes`, and
  `verbatimModuleSyntax` enabled.

## 3. Tokens and theming

### Three tiers

| Tier | Example | Public API | Overridden by |
|---|---|---|---|
| Primitive | `color.blue.500`, `space.4`, `font.size.300` | No | Nobody |
| Semantic | `color.bg.surface`, `color.fg.muted`, `space.inline.md`, `radius.control` | Yes | Themes, consumers |
| Component (v2) | `button.bg`, defaulting to a semantic token | Yes | Consumers, per subtree |

Components reference semantic and component tokens only, never primitives.

### Source and build

- Source is W3C Design Tokens Community Group JSON (`$type`, `$value`), one
  file per tier plus one per theme and density.
- Built with Style Dictionary v4.
- Build outputs:
  - `tokens.css`: all primitives on `:root`.
  - `theme-light.css`, `theme-dark.css`: semantic tokens under
    `[data-theme="light"]` and `[data-theme="dark"]`. Light is also applied on
    `:root` as the default. Dark is also applied under
    `@media (prefers-color-scheme: dark)` when no `data-theme` attribute is set
    on an ancestor.
  - `density-compact.css`, `density-comfortable.css`, `density-spacious.css`
    under `[data-density="..."]`. Comfortable is the default on `:root`.
  - `tokens.ts`: typed constants mapping token names to `var(--mb-...)`
    strings and a `TokenName` union type.

### Naming

- All custom properties carry the `--mb-` prefix.
- Semantic names follow `category.role.modifier`, e.g. `--mb-color-fg-muted`,
  `--mb-space-stack-lg`.
- Density affects only spacing and control-size tokens, never color or type
  scale, so any density composes with any theme.

### Scoping

Theme and density are applied by setting `data-theme` or `data-density` on
any ancestor. Custom properties inherit through shadow roots, so a
`<section data-theme="dark">` inside a light page is fully supported. No
JavaScript reads or writes theme state. `core` never reads tokens.

## 4. Core behavior layer

### Patterns in v1

| Pattern | Proves |
|---|---|
| Listbox | Roving tabindex, single and multi selection, typeahead, `aria-activedescendant` versus focus movement |
| Dialog | Focus trap, focus restore, Escape and outside-click dismissal, nested dialog stack, inert background |
| Disclosure | Simplest pattern; the teaching example and base for accordion and menu later |
| Form association | ElementInternals value, validity, reset, label click, `:invalid` and `:user-invalid` |

Form association is a mixin in the Lit adapter (section 5) and has no
`core/state` or `core/dom` counterpart; the `core/a11y` package holds nothing
form-specific.

### Layer 1: `core/state`

One class per pattern holding plain state.

- Public shape: typed fields, typed action methods, and
  `subscribe(listener): () => void`.
- Example: `ListboxState` has `items`, `activeIndex`, `selected`, and actions
  `moveNext`, `movePrev`, `moveFirst`, `moveLast`, `selectActive`,
  `toggleActive`, `typeahead(char)`, `setItems(items)`.
- No DOM access. No globals. The only timer permitted is the typeahead reset,
  and it is injectable for tests.
- All state is derived from data passed in. This layer is what SSR renders
  from and what unit tests cover exhaustively.

### Layer 2: `core/dom`

One `attachX(elements, options)` function per pattern returning
`{ state, dispose }`.

- Subscribes to the layer 1 state and writes ARIA attributes and `tabindex` on
  the provided elements. Binds keyboard and pointer listeners.
- Elements are passed in directly or through a callback (for example
  `items: () => HTMLElement[]`). The behavior never queries by selector,
  class, or tag. No DOM shape is assumed.
- Each behavior documents the fixed list of attributes it writes and never
  touches attributes outside that list.
- All listeners are registered with a single `AbortController`; `dispose`
  aborts it.
- Nothing runs at import time. Modules are importable on the server with no
  side effects.
- Given identical layer 1 state, layer 2 produces identical attribute output
  on every run (required for hydration; see section 5).

### `core/a11y`

Shared, public utilities:

- Focus trap.
- Tabbable element discovery that pierces open shadow roots.
- Focus restore.
- `uniqueId()` that is deterministic under SSR (counter seeded per render,
  not random).
- A single shared live region for announcements, created lazily on first
  client use.

### `core/testing`: conformance suites

Each pattern exports a conformance suite: a function that accepts a factory
which mounts any implementation of the pattern and returns the relevant
elements. The suite asserts:

- The WAI-ARIA Authoring Practices keyboard interaction table for that
  pattern.
- Required ARIA roles, states, and properties at each step.
- Focus location after each interaction.

The Lit adapter, the future styled components, and any consumer skin run the
same suite. Passing the suite is the definition of a conforming
implementation.

## 5. Lit adapter, forms, and SSR

### Controllers

One reactive controller per `core/dom` behavior. Each:

- Calls the `attach` function in `hostConnected` and `dispose` in
  `hostDisconnected`.
- Exposes the layer 1 state instance as `controller.state`.
- Calls `host.requestUpdate()` on every state change.
- Adds no behavior of its own. Target size is roughly thirty lines.

### Mixins

Exactly two in v1.

`FormAssociated(Base)`:

- Sets `static formAssociated = true` and calls `attachInternals()` in the
  constructor.
- Provides `value`, `name`, `disabled`, `required`, and read-only `validity`.
- Implements `formResetCallback`, `formDisabledCallback`, and
  `formStateRestoreCallback`.
- Accepts a `validators` list on the element; each validator returns a
  `ValidityStateFlags` fragment and message, and the mixin aggregates them
  into `internals.setValidity`.
- Sets custom states through `internals.states`, at minimum `invalid` and
  `user-invalid`.

`DelegatesFocus(Base)`:

- Sets `static shadowRootOptions = { ...Base.shadowRootOptions, delegatesFocus: true }`.

Mixin typing uses one shared `Constructor<T>` helper. Each mixin exports its
public interface separately (`FormAssociatedInterface`,
`DelegatesFocusInterface`) so hosts can declare `implements`.

### Controller versus mixin rule

A feature is a mixin only if it requires a static property, a constructor
call, or a lifecycle callback delivered only to the element class. Everything
else is a controller.

### SSR rules

Enforced by tests that render every adapter through `@lit-labs/ssr` and
hydrate in a browser.

1. The first render depends only on properties and layer 1 state. Never on
   child elements, layout, or measurements.
2. `core/dom` is invoked only in `hostConnected`, which does not run on the
   server.
3. ARIA attributes that must be present before hydration are rendered in the
   template from layer 1 state. Layer 2 reconciles on the client and must
   produce identical output for identical state.
4. No `window` or `document` access at module scope anywhere in `core` or
   `lit`.

### Cross-root ARIA

Where a relationship needs an ID reference (`aria-labelledby`,
`aria-controls`, `aria-activedescendant`):

- Use `ElementInternals` reflected ARIA element references
  (`ariaLabelledByElements` and related) when available.
- Fall back to string IDs when both elements are in the same root.
- Relationships across roots without reflected element references are
  documented as unsupported.
- The dialog and listbox patterns place label and control in the same root
  by default.

## 6. Styling contract for the future skin

Ships in v1 only as the README of `@match-box/components`. No code.

### Customization surfaces, in order of preference

1. Tokens. Every visual property reads a component token defaulting to a
   semantic token. Overriding on any ancestor restyles that subtree.
2. Parts. Each component exposes a documented, stable set of `part` names
   (for example `base`, `label`, `prefix`, `suffix`). Adding a part is a minor
   version; removing or renaming one is a major.
3. Slots. Named slots for consumer-supplied content (icons, labels, helper
   text). Default slot content is always provided so a component works with no
   children.

Beyond these three surfaces, a consumer who needs a different structure uses
the core layer directly. The skin ships no `unstyled` attribute and no global
style injection.

### Rules

- Shadow DOM always. `delegatesFocus` on any component containing a
  focusable.
- State is reflected through attributes and custom states so parts can be
  styled by condition (`::part(base):state(invalid)`, `[open]`).
- Sizes and density come only from tokens. No `size` attribute in the first
  skin release. If a per-instance size is added later, it sets the same tokens
  and nothing else.
- Components never set `margin` on their host.
- Every `static styles` block uses the typed constants from `tokens.ts`,
  never string literals for token names.
- Icons are accepted through a slot. Components impose only sizing. No icon
  set is bundled.

## 7. Tooling, testing, docs, release

### Build

- TypeScript compiled with `tsc` only. No bundler. Each package emits ESM,
  declaration files, and source maps.
- Style Dictionary runs as the `tokens` build step.
- Root `pnpm build` runs packages in dependency order using workspace
  topology.

### Testing

| Level | Target | Tool |
|---|---|---|
| Unit | `core/state` classes | Vitest in Node; exhaustive transition coverage |
| Browser | `core/dom`, `core/a11y`, `@match-box/lit` | `@web/test-runner` with Playwright on Chromium, Firefox, WebKit; conformance suites run against a minimal test skin |
| Accessibility | All browser tests | `axe-core` assertions plus the conformance suites |
| SSR | Every Lit adapter | Render through `@lit-labs/ssr`, hydrate in a browser, assert no hydration mismatch and no console errors |

### Docs

- `custom-elements-manifest` analyzer generates API data from source.
- Docs site is Eleventy consuming the manifest. The site is a real consumer
  of the published packages; demos double as integration tests.
- Each pattern page shows, in order: the layer 1 API, the layer 2 attach
  function, the Lit controller, and a plain HTML example.
- Storybook is not used in v1.

### CI gates

Typecheck, ESLint including the dependency direction rule, all test levels,
a bundle size check per package entry point against a checked-in budget, and
a changeset presence check on pull requests.

### Release

- Changesets with independent versioning per package.
- All packages start at `0.x` and stay there until the conformance suites
  pass on all three engines and the author's own Lit application has used
  `core` for a complete feature.
- Semver applies to everything documented: token names, attributes written by
  behaviors, part names, exported types.

### Browser support

Last two versions of evergreen browsers. Baseline requirements are
ElementInternals, `:state()`, and Declarative Shadow DOM (roughly 2023
onward). No polyfills shipped. Missing reflected ARIA element references in
Firefox is a documented graceful fallback, not a blocker.

## 8. Decisions log

| Decision | Alternatives rejected | Reason |
|---|---|---|
| Framework-agnostic core with Lit as first adapter | Lit controllers as the headless layer; unstyled base elements with styled subclasses; pure state machine runtime | Headless is the priority; controllers would tie primitives to Lit; subclassing across packages is fragile; a machine runtime is out of proportion for four patterns |
| Own the primitives | Build on Zag.js | Behavior layer is the product |
| Foundations only in v1 | Ship eight core components | Prove the three-layer architecture on the hardest patterns before adding a skin |
| Static CSS themes | Runtime theme objects | One brand; static CSS is simpler and needs no JavaScript |
| Eleventy docs, no Storybook | Storybook | Storybook earns its place with the skin in v2 |
| `tsc` only | Rollup, Vite library mode | No bundling needed for ESM libraries; fewer moving parts |
