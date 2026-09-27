# match-box design system: v1 design

Date: 2026-09-22 (restart of the 2026-09-18 draft)
Status: approved for planning

## 1. Purpose and positioning

match-box is a public, open-source design system built on Lit. Its
distinguishing feature is a headless behavior layer that does not depend on
Lit or any framework. Lit is the first adapter, not the foundation.

Audience, in priority order:

1. The author's own Lit applications, which consume the headless layer
   directly.
2. Teams on any framework (Vue, Svelte, Angular, plain HTML), who consume the
   framework-free DOM behaviors in v1 and the styled web components in v2.
3. The open-source community, which requires strong docs, semver discipline,
   and predictable customization surfaces.

The primitives are owned, not delegated. Zag.js and similar libraries were
considered and rejected: the behavior layer is the product.

### v1 scope

Foundations only. No styled components ship in v1.

- One hand-written token file with light and dark themes.
- Headless core: four behavior patterns across three layers.
- Lit adapter: controllers and two mixins.
- Conformance test suites that any implementation can run.
- A short styling contract document for the future skin.

### v1 non-goals

- Styled components (v2).
- React wrappers (v2).
- Server-side rendering and hydration (v2 at the earliest).
- Popover positioning or anchoring.
- Density axis, token build pipeline, design-tool sync.
- Multi-brand theming, runtime theme generation.
- Bundled icon set.
- Polyfills.

## 2. Package

One npm package, `match-box`, ESM only, `sideEffects: false`.

| Subpath | Contents | Imports |
|---|---|---|
| `match-box/core` | Headless layer: `state`, `dom`, `a11y`, `testing` | nothing |
| `match-box/lit` | Controllers and mixins | `core`, `lit` |
| `match-box/tokens.css` | The token file | nothing |

Source layout mirrors the subpaths: `src/core`, `src/lit`, `src/tokens`.

Rules:

- Dependency direction is `core` and `tokens` at the bottom, `lit` above.
  `core` never imports from `lit`. Enforced by code review, not tooling.
- No custom element is registered anywhere in the package.
  `customElements.define` does not appear in v1.
- Splitting into separate packages later is a mechanical move because the
  subpaths already mark the seams.
- One `tsconfig` with `strict`, `exactOptionalPropertyTypes`, and
  `verbatimModuleSyntax` enabled.

## 3. Tokens

### Three tiers

| Tier | Example | Public API | Overridden by |
|---|---|---|---|
| Primitive | `--mb-blue-500`, `--mb-space-4` | No | Nobody |
| Semantic | `--mb-color-bg-surface`, `--mb-color-fg-muted`, `--mb-space-inline-md`, `--mb-radius-control` | Yes | Themes, consumers |
| Component (v2) | `--mb-button-bg`, defaulting to a semantic token | Yes | Consumers, per subtree |

### The file

`src/tokens/tokens.css`, written by hand, three blocks:

1. `:root { ... }` primitives.
2. `:root, [data-theme="light"] { ... }` semantic tokens, light values.
3. `[data-theme="dark"] { ... }` semantic tokens, dark values, and the same
   block repeated under `@media (prefers-color-scheme: dark)` scoped to
   `:root:not([data-theme="light"])`.

Rules:

- All custom properties carry the `--mb-` prefix.
- Semantic names follow `category-role-modifier`.
- The semantic tier starts at roughly thirty tokens. A token is added only
  when a concrete consumer (the test skin or a v2 component) needs it.
- Theme is applied by setting `data-theme` on any ancestor. Custom properties
  inherit through shadow roots. No JavaScript reads or writes theme state.
  `core` never reads tokens.

## 4. Core behavior layer

### The three layers

An accessible widget is three kinds of code: deciding what happens, applying
it to the DOM, and scheduling it inside a framework's lifecycle. Each kind is
one layer.

| Layer | Subpath | Knows about | Consumed by |
|---|---|---|---|
| State | `core/state` | Nothing but its own data | Unit tests in Node, templates, `core/dom` |
| DOM | `core/dom` | Real elements handed to it | Vue, Svelte, plain HTML, `lit` controllers |
| Adapter | `lit` | Lit lifecycle | Lit applications, the v2 skin |

### The single-writer rule

Every attribute has exactly one writer. `core/dom` owns ARIA attributes and
`tabindex`. Templates own everything visual (classes, parts, data attributes
for styling). Neither touches the other's attributes. Each behavior documents
the list of attributes it writes.

### Patterns in v1

| Pattern | Proves |
|---|---|
| Listbox | Roving tabindex, single and multi selection, typeahead, disabled items. `aria-activedescendant` is not in v1 but the layer 2 API must not preclude adding it as a focus strategy for the v2 combobox |
| Disclosure | The simplest pattern; the teaching example and base for accordion and menu later |
| Dialog | Open state, outside-click dismissal, `returnValue`, on top of the native `<dialog>` element |
| Form association | ElementInternals value, validity, reset, label click, `:state(invalid)` |

Form association is a mixin in the Lit adapter (section 5) and has no
`core/state` or `core/dom` counterpart.

### Dialog uses the native element

`attachDialog` requires an `HTMLDialogElement` and opens it with
`showModal()`. The platform provides the focus trap, the inert background,
stacking through the top layer, Escape handling, and focus restore. The
behavior adds only the open state in layer 1, outside-click dismissal, and
`returnValue` plumbing. No hand-written focus trap ships for the dialog.

### Layer 1: `core/state`

One class per pattern holding plain state.

- Public shape: typed fields, typed action methods, and
  `subscribe(listener): () => void`.
- Example: `ListboxState` has `items`, `activeIndex`, `selected`, and actions
  `moveNext`, `movePrev`, `moveFirst`, `moveLast`, `selectActive`,
  `toggleActive`, `typeahead(char)`, `setItems(items)`.
- No DOM access. No globals. The only timer permitted is the typeahead reset,
  and it is injectable for tests.
- Listeners are notified synchronously after each action.

### Layer 2: `core/dom`

One `attachX(elements, options)` function per pattern returning
`{ state, dispose }`.

- Subscribes to the layer 1 state and writes ARIA attributes and `tabindex` on
  the provided elements. Binds keyboard and pointer listeners. Calls `focus()`
  when the pattern moves focus.
- Elements are passed in directly or through a callback such as
  `items: () => HTMLElement[]`. The behavior never queries by selector, class,
  or tag. No DOM shape is assumed.
- All listeners are registered with a single `AbortController`; `dispose`
  aborts it and removes the attributes it wrote.
- Each behavior remembers the attributes it last wrote per element and
  removes any that are no longer produced on the next update, so an item that
  stops being active loses `aria-selected` without the template's help. (This
  is how Zag's vanilla adapter applies props, verified 2026-09-27.)
- Nothing runs at import time. No `window` or `document` access at module
  scope anywhere in `core` or `lit`. This is the one rule kept from the SSR
  design because it costs nothing and cannot be retrofitted mechanically.
- ID references (`aria-labelledby`, `aria-controls`,
  `aria-activedescendant`) are wired after attach, on the client, using
  reflected element references (`ariaLabelledByElements` and related, Baseline
  since 2025). String IDs are generated with a simple client counter only
  where an element reference is not applicable.

### `core/a11y`

Shared, public utilities:

- Tabbable element discovery that pierces open shadow roots. Not needed by
  the v1 patterns themselves; kept public because the future menu and popover
  patterns need it and consumers building custom patterns do too.
- Focus restore helper.
- `uniqueId()` client counter.
- A single shared live region for announcements, created lazily on first use.

### `core/testing`: conformance suites

Each pattern exports a conformance suite written for Mocha and Chai, the
runner and assertion library `@web/test-runner` provides. A suite is a
function that accepts a factory which mounts any implementation of the
pattern and returns the relevant elements. The suite asserts:

- The WAI-ARIA Authoring Practices keyboard interaction table for that
  pattern.
- Required ARIA roles, states, and properties at each step.
- Focus location after each interaction.

Each suite runs twice, once driving the pattern by keyboard and once by
pointer, following the `interactionType` idea in React Aria's test
utilities.

The Lit adapter, the future styled components, and any consumer skin run the
same suite. Passing the suite is the definition of a conforming
implementation. Consumers on other runners adapt the suite themselves.

## 5. Lit adapter

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

- Sets `static formAssociated = true`. `ElementInternals` is created lazily
  through a getter on first access rather than in the constructor, so it is
  usable from methods that run during construction. (Material Web's
  `mixinElementInternals` does this; verified 2026-09-27.)
- Provides `value`, `name`, `disabled`, `required`, and read-only `validity`.
- Implements `formResetCallback`, `formDisabledCallback`, and
  `formStateRestoreCallback`.
- Accepts a `validators` list; each validator returns a `ValidityStateFlags`
  fragment and a message, aggregated into `internals.setValidity`.
- Sets custom states through `internals.states`, at minimum `invalid` and
  `user-invalid`.

`DelegatesFocus(Base)`:

- Sets `static shadowRootOptions = { ...Base.shadowRootOptions, delegatesFocus: true }`.

Mixin typing uses one shared `Constructor<T>` helper. Each mixin exports its
public interface separately so hosts can declare `implements`.

### Controller versus mixin rule

A feature is a mixin only if it requires a static property, a constructor
call, or a lifecycle callback delivered only to the element class. Everything
else is a controller.

## 6. Styling contract for the future skin

Written as `docs/styling-contract.md` in v1. No code. It exists so that
decisions in `core` do not box the skin in.

Customization surfaces, in order of preference:

1. Tokens. Every visual property reads a component token defaulting to a
   semantic token.
2. Parts. Each component exposes a documented, stable set of `part` names.
   Adding a part is a minor version; removing or renaming one is a major.
3. Slots. Named slots for consumer-supplied content, always with default
   content.

Beyond these, a consumer who needs a different structure uses the core layer
directly. The skin ships no `unstyled` attribute and no global style
injection.

Rules: shadow DOM always; `delegatesFocus` on any component containing a
focusable; state reflected through attributes and custom states so parts can
be styled by condition; no `size` attribute in the first skin release; no
`margin` on hosts; icons through a slot, no bundled set.

## 7. Tooling, testing, docs, release

### Build

TypeScript compiled with `tsc` only. ESM, declaration files, source maps.
`tokens.css` is copied as is.

### Testing

| Level | Target | Tool |
|---|---|---|
| Unit | `core/state` classes | Vitest in Node; exhaustive transition coverage |
| Browser | `core/dom`, `core/a11y`, `lit` | `@web/test-runner` with Playwright on Chromium, Firefox, WebKit; conformance suites run against a minimal, unpublished test skin |
| Accessibility | All browser tests | `axe-core` assertions plus the conformance suites |

### Docs

- API data generated by TypeDoc from source.
- Docs site is Eleventy. The site is a real consumer of the package; demos
  double as integration tests.
- Each pattern page shows, in order: the layer 1 API, the layer 2 attach
  function, the Lit controller, and a plain HTML example.

### CI gates

Typecheck, ESLint, all test levels, and a bundle size check per subpath
against a checked-in budget.

### Release

- Single version for the package, semver, starting at `0.x`.
- Leaves `0.x` when the conformance suites pass on all three engines and the
  author's own Lit application has used `core` for a complete feature.
- Semver applies to everything documented: token names, attributes written by
  behaviors, exported types.

### Browser support

Last two versions of evergreen browsers. Baseline requirements are
ElementInternals, `:state()`, reflected ARIA element references, and the
native `<dialog>` element. No polyfills.

## 8. Decisions log

| Decision | Alternatives rejected | Reason |
|---|---|---|
| Three-layer core, framework-free, Lit as first adapter | Merged attach function; Lit-only controllers; base-class mixins; statechart plus connect | Only shape where a Node test and a plain HTML page both reach the behavior |
| Own the primitives | Zag.js | Behavior layer is the product. Note: Zag now ships a vanilla adapter (`@zag-js/vanilla`) usable from Lit, so this is a product decision, not a technical necessity |
| Foundations only in v1 | Eight core components | Prove the layers before adding a skin |
| One package | Monorepo with four packages | Boundaries live in subpaths; versioning tooling has no job yet |
| Hand-written tokens | W3C JSON with Style Dictionary | No design file to sync with |
| No density axis | Three density files | Meaningful only once components consume spacing |
| Client only | SSR with four rules and a hydration test level | Removes the hardest unsolved problem in the first draft |
| Native `<dialog>` | Hand-rolled focus trap, inert, stack | Platform owns the a11y and composes across shadow roots. Zag still hand-rolls (trapFocus, preventBodyScroll, ariaHidden) because it supports non-modal and positioned dialogs; v1 is modal only, so the platform path holds |
| TypeDoc | custom-elements manifest | v1 has no custom elements |
| Conformance suites on Mocha and Chai | Injected assertion interface | Matches the runner in use; less code |
| Eleventy docs, no Storybook | Storybook | Earns its place with the skin |
| `tsc` only | Rollup, Vite library mode | Fewest moving parts |

## 9. Verification against current libraries (2026-09-27)

Checked against source on the main branches of adobe/react-spectrum,
chakra-ui/zag, material-components/material-web, and the lit.dev controller
docs.

| Claim in this spec | Status | Detail |
|---|---|---|
| State, behavior, component layering is mainstream | Confirmed | React Aria: state hooks are platform-agnostic, behavior hooks depend on the platform and return props to spread, components render. `useListBox(props, state, ref)` takes a ref |
| Shipped conformance testers exist | Confirmed | `@react-aria/test-utils` has testers for listbox, dialog, menu, tabs, select, combobox, table, tree, and more, with `interactionType` of mouse, touch, or keyboard |
| Zag is machine, connect, adapters | Confirmed | Statecharts; `connect` returns prop getters; elements located by id within a scope, never by selector |
| Zag has no vanilla adapter | Wrong | `@zag-js/vanilla` exists and applies props imperatively with per-element bookkeeping of previously written attributes |
| Zag's dialog is on native `<dialog>` | Not the case | Zag hand-rolls focus trap, scroll lock, and aria-hidden. The v1 decision stands for modal-only, see decisions log |
| Zag listbox uses roving tabindex | Not the case | Zag uses `aria-activedescendant` with the container at `tabindex=0`. Both are APG-valid; v1 keeps roving and must not preclude activedescendant |
| Material Web form association is a mixin | Confirmed, with a refinement | `formAssociated` static is on the mixin; internals come from a separate mixin with a lazy getter; reset and restore callbacks are left optional |
| Controllers are Lit's unit of reusable behavior | Confirmed | Lit docs: controllers have their own identity, do not extend the prototype, and allow multiple instances per host |

## 10. Changes from the 2026-09-18 draft

Removed: monorepo and Changesets, token build pipeline, density axis,
generated `tokens.ts`, SSR rules and test level, deterministic `uniqueId`,
hand-rolled dialog focus trap, custom-elements manifest, empty components
package.

Corrected: the earlier claim that Firefox lacks reflected ARIA element
references was wrong; the feature is Baseline across all three engines since
2025 and is now a requirement, not a fallback.

Kept: three-layer core, owned primitives, four patterns, light and dark
themes with the `--mb-` prefix, ESM with `tsc`, the styling contract, the
`0.x` exit criteria.
