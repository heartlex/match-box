# match-box v2 step 1: styled components foundations

Date: 2026-09-27
Status: approved for planning
Builds on: `docs/superpowers/specs/2026-09-18-match-box-design.md` (v1)

## 1. Purpose and scope

v2 adds styled web components on top of the v1 core and Lit adapter. It is
built in steps, each with its own spec, plan, and `0.x` minor release:

| Step | Components | New work beyond styling |
|---|---|---|
| 1 (this spec) | Button, disclosure, accordion, dialog, listbox | Skin foundations; color roles; accordion behavior |
| 2 | Text field, checkbox, switch | Form controls on `FormAssociated`; label, description, and error pattern |
| 3 | Select | Popover and positioning (native `popover` and CSS anchor positioning); lifts the v1 non-goal |
| 4 | Combobox | `aria-activedescendant` focus strategy in the core; reuses select's popover |

React wrappers and server-side rendering are separate sub-projects after
the components.

Step 1 ships as `0.2.0`. Success means every step 1 component:

- passes its pattern's conformance suite and axe on Chromium, Firefox, and
  WebKit, by keyboard and by pointer;
- can be restyled entirely through color roles, component tokens, parts,
  and slots;
- has a docs page with a live demo and API tables generated from source.

### Non-goals for step 1

- Text field, checkbox, switch, select, combobox (later steps).
- A `size` attribute or density axis.
- Animations and transitions.
- Visual regression screenshots.
- Link-styled buttons (`href`).
- Arrow-key navigation between accordion headers (optional in the APG).

## 2. Package

### Subpaths

| Subpath | Contents | Registers tags |
|---|---|---|
| `match-box/components` | Classes `MbButton`, `MbDisclosure`, `MbAccordion`, `MbDialog`, `MbListbox`, `MbOption` | No |
| `match-box/components/define/<name>.js` | Registers one tag and the tags it depends on | Yes |
| `match-box/components/define/all.js` | Registers every component | Yes |

Define modules:

- `define/button.js` → `mb-button`; `define/disclosure.js` → `mb-disclosure`;
  `define/accordion.js` → `mb-accordion`, `mb-disclosure`;
  `define/dialog.js` → `mb-dialog`, and `mb-button` for its close button;
  `define/listbox.js` → `mb-listbox`, `mb-option`.
- Each checks `customElements.get(tag)` before defining, so importing a
  define module twice, or from two copies of the package, does not throw.

### Source layout

- `src/components/<name>/<name>.ts` (element) and `<name>.styles.ts` (styles).
- `src/components/define/<name>.ts` and `src/components/define/all.ts`.
- `src/components/shared/styles.ts`: the host reset, focus ring, and
  forced-colors rules shared by every component.
- `src/components/index.ts`: class exports only.

### Rules

- `customElements.define` appears only under `src/components/define/`. The
  v1 rule that nothing registers a tag still holds everywhere else.
- `sideEffects` is `["**/*.css", "./dist/components/define/*.js"]`.
- Dependency direction: `components` → `lit` (adapter) → `core`.
  Components use the v1 controllers and mixins; they never import
  `core/dom` directly.
- `lit` remains an optional peer dependency, required by `match-box/lit`
  and `match-box/components`.
- No shared component base class. Each component extends `LitElement` and
  applies the v1 mixins it needs.
- `size-budget.json` gains a gzip budget for `match-box/components` and
  `match-box/components/define/all.js`.
- The v1 rules on module scope (no `window` or `document` access at import
  time), `tsconfig` flags, and ESM-only output apply to components too.

## 3. Styling

### Color roles

Five roles: `neutral` (default), `primary`, `secondary`, `tertiary`,
`danger`. A component's `color` attribute picks the role. Each role is six
semantic tokens:

| Token | Meaning |
|---|---|
| `--mb-color-<role>-solid` | Filled background |
| `--mb-color-<role>-solid-hover` | Filled background on hover |
| `--mb-color-<role>-on-solid` | Text and icons on `solid` |
| `--mb-color-<role>-text` | Text on a surface (outline, ghost, selected option) |
| `--mb-color-<role>-subtle` | Tinted background (ghost hover, selected option) |
| `--mb-color-<role>-border` | Borders (outline) |

- A theme sets a role by overriding its six tokens. Every component and
  variant follows.
- `tokens.css` ships all five roles in light and dark. New primitive
  palettes back `secondary` (violet) and `tertiary` (teal).
- The roles replace these v1 tokens: `--mb-color-bg-accent`,
  `--mb-color-bg-accent-hover`, `--mb-color-fg-on-accent`,
  `--mb-color-fg-accent`, `--mb-color-bg-danger`, `--mb-color-fg-danger`,
  `--mb-color-border-danger`. Allowed under `0.x`; the release notes and
  `docs/styling-contract.md` list the mapping.
- Contrast requirements, per role and theme: `on-solid` on `solid` and on
  `solid-hover` at least 4.5:1; `text` on `--mb-color-bg-surface` and on
  `subtle` at least 4.5:1; `border` on `--mb-color-bg-surface` at least 3:1.

### Structural variants

A component's `variant` attribute picks its structure. Only components
whose structure varies have one.

| Component | Variants |
|---|---|
| `mb-button` | `default` (filled: `solid`, `on-solid`, `solid-hover`), `outline` (`border`, `text`, `subtle` on hover), `ghost` (`text`, `subtle` on hover) |

Any `variant` combines with any `color`.

### Component tokens

- Every visual property reads a component token that falls back to a role
  or semantic token: `background: var(--mb-button-bg, var(--mb-color-primary-solid))`.
- Components never declare their own tokens on `:host`, so a value set on
  any ancestor or on the element itself wins.
- Name: `--mb-<component>-<property>[-<state>]`. Each component's token
  list is documented and follows semver.

### Parts, states, and host

- Every meaningful internal element has a documented `part`.
- Styles may select on the ARIA attributes the core writes, e.g.
  `mb-option` uses `:host([aria-selected='true'])`.
- Component-owned conditions are custom states, e.g. `:state(open)`.
- Boolean properties reflect to attributes.
- Every focusable part shows a `:focus-visible` ring using
  `--mb-focus-ring-width` and `--mb-color-border-focus`.
- An `@media (forced-colors: active)` block keeps borders, selection, and
  focus visible with system colors.
- No `margin` on any host. `mb-button` is `inline-flex`; the others are
  `block`.

## 4. Components

### `mb-button`

| Kind | API |
|---|---|
| Attributes | `variant` (`default` \| `outline` \| `ghost`, default `default`), `color` (role, default `neutral`), `type` (`button` \| `submit` \| `reset`, default `button`), `disabled` |
| Slots | default (label), `prefix`, `suffix` |
| Parts | `base`, `label`, `prefix`, `suffix` |
| Events | native `click` |

- Renders `<button part="base">` in shadow DOM; `DelegatesFocus`.
- Form-associated (`static formAssociated = true`, own `ElementInternals`)
  only to find its form: `type="submit"` calls `form.requestSubmit()`,
  `type="reset"` calls `form.reset()`. It is not a submitter and submits no
  value.
- `disabled`, or a disabled ancestor `<fieldset>`, disables the inner
  button and suppresses submit and reset.

### `mb-disclosure`

| Kind | API |
|---|---|
| Attributes | `open` (reflected), `color`, `heading-level` (1 to 6, optional) |
| Slots | `summary` (trigger text), default (panel content) |
| Parts | `trigger`, `icon`, `panel` |
| States | `:state(open)` |
| Events | `toggle` (`ToggleEvent`, `newState`/`oldState`), fired after user and programmatic changes |

- Uses the v1 `DisclosureController`. `open` and the controller state are
  kept in sync both ways.
- With `heading-level`, the trigger is wrapped in an element with
  `role="heading"` and `aria-level`, as the APG accordion pattern requires.

### `mb-accordion`

| Kind | API |
|---|---|
| Children | `mb-disclosure` elements |
| Attributes | `multiple` (default `false`), `heading-level` (applied to child disclosures that have none) |
| Slots | default |
| Parts | `base` |

- New core behavior:
  - Layer 1 `AccordionState`: open item keys; `multiple`; actions `open(key)`,
    `close(key)`, `toggle(key)`, `setItems(keys)`, `setMultiple(multiple)`.
    With `multiple` false, opening one item closes the others.
  - Layer 2 `attachAccordion({ items: () => DisclosureLike[] }, options)`
    coordinates the children's disclosure states. It writes no attributes
    itself.
  - Lit `AccordionController`.
  - `accordionConformance` suite in `core/testing`: roles, `aria-expanded`,
    `aria-controls`, heading levels, single and multiple modes, keyboard and
    pointer.

### `mb-dialog`

| Kind | API |
|---|---|
| Attributes | `open` (reflected), `label`, `color`, `persistent`, `close-label` (default `Close`) |
| Properties | `returnValue` |
| Methods | `show()`, `close(returnValue?)` |
| Slots | `heading`, default (body), `footer` |
| Parts | `dialog`, `header`, `title`, `close-button`, `body`, `footer` |
| States | `:state(open)` |
| Events | `close`, `cancel` (re-dispatched from the host) |

- Uses the v1 `DialogController` on a native `<dialog>` in shadow DOM;
  `showModal()` only.
- The title element is `<h2 part="title"><slot name="heading">{label}</slot></h2>`
  and labels the dialog.
- `persistent` turns off outside-click dismissal. Escape still closes.
- The close button is an `mb-button` with `variant="ghost"`, named by
  `close-label`.
- A light-DOM `<form method="dialog">` inside `mb-dialog` cannot close the
  shadow `<dialog>` natively, because the platform closes only a dialog
  that is the form's DOM ancestor. `mb-dialog` listens for `submit` from
  slotted forms whose method is `dialog`, prevents the default, and closes
  with the submitter's `value`. The planning spike verifies this on all
  three engines.

### `mb-listbox` and `mb-option`

`mb-listbox`:

| Kind | API |
|---|---|
| Attributes | `label`, `multiple`, `name`, `required`, `disabled`, `color` |
| Properties | `value: string` (first selected value or `''`), `values: string[]` (all selected values) |
| Slots | default (`mb-option` elements) |
| Parts | `label`, `listbox` |
| Events | `input`, `change` (user selection only) |

`mb-option`:

| Kind | API |
|---|---|
| Attributes | `value` (defaults to its text content), `disabled`, `selected` (initial selection only, like `<option selected>`; the live selection is on `mb-listbox`) |
| Slots | default (label), `prefix`, `suffix` |
| Parts | `base`, `check` (shown in multiple mode), `prefix`, `label`, `suffix` |

- `mb-listbox` renders `<span part="label">` and `<div part="listbox"><slot></slot></div>`
  and attaches the v1 `ListboxController` with the listbox `div` as root,
  the label span as label, and the slotted `mb-option` elements as items.
  The core writes `role`, `aria-selected`, `aria-disabled`, and `tabindex`
  on the `mb-option` elements.
- The option key is the option's `value`. Disabled comes from the option's
  `disabled` or the listbox's `disabled`.
- Built on `FormAssociated`. The form value is the selected values; with
  `multiple`, one entry per value. `required` fails with `valueMissing`
  when nothing is selected. Reset restores the selection declared by
  `selected` attributes on options at first connect.
- Setting `value` or `values` updates the selection without firing events.
- `input` and `change` fire after a user selects or deselects.
- Core change: `ListboxState` gains `setMultiple(multiple)`. Turning
  `multiple` off keeps only the first selected key. This makes `multiple` a
  normal reactive attribute and closes the v1 deferred minor.

## 5. Testing

| Level | What |
|---|---|
| Conformance | Each component runs its pattern's suite through a fixture: disclosure, dialog, listbox (single and multiple), and the new accordion suite. Keyboard and pointer, three engines, axe. |
| Component API | Attributes and properties, reflection, custom states, events and when they fire. |
| Forms | `mb-listbox` in `FormData` (single, multiple), `required`, reset, disabled `<fieldset>`, label click. `mb-button` submit and reset against a real form. |
| Styling contract | Every `color` × `variant` resolves to the documented role tokens (computed styles); a component token set on an ancestor wins; `::part()` styling works; `emulateMedia({ forcedColors: 'active' })` keeps focus ring and borders visible. |
| Accessibility | axe for every `color` × `variant` combination, light and dark. |
| Tokens | Existing token test extended: every role has its six tokens in both themes, and meets the contrast requirements in section 3. |
| Core | Vitest for `AccordionState` and `ListboxState.setMultiple`; browser tests for `attachAccordion`. |

## 6. Docs

- One page per component: live demo (built package, `define/all.js`),
  then tables for attributes, properties, events, slots, parts, and
  component tokens.
- A Theming page: the five roles, their tokens, and how to override them
  globally and per subtree.
- `@custom-elements-manifest/analyzer` generates `custom-elements.json`
  from source. It is published in the package and referenced by
  `package.json`'s `customElements` field, for editor autocompletion. The
  component pages render their tables from it. TypeDoc remains for `core`
  and `lit`.
- `docs/styling-contract.md` is updated for color roles, variants, and the
  v1 token mapping.

## 7. Decisions log

| Decision | Alternatives rejected | Reason |
|---|---|---|
| Separate define modules | Auto-define on import; classes only | Clean tree-shaking; safe with duplicate package copies; room for scoped registries |
| Child-element content model | Data property; both | Works in plain HTML and every framework; rich option content; SSR later |
| `mb-listbox` is form-associated | Plain widget | Matches `<select multiple>`; proves `FormAssociated` before step 2 |
| Components use the v1 controllers; ARIA as attributes on light-DOM children | ARIA via `ElementInternals`; component-specific logic | No core rework; dogfoods the adapter; can move to internals later without API change |
| Two axes: `color` (role) and `variant` (structure) | One `variant` mixing both | Themes define colors once; structure and color combine freely |
| Five roles × six tokens | Per-component color tokens only | One place to theme; components stay consistent |
| Accordion behavior in the core | Coordination inside the component | Behavior belongs in the core and gets a conformance suite |
| Custom-elements manifest for component docs | TypeDoc only | v1 rejected it only for lacking custom elements; editors consume it |
| No shared base class | `MbElement` base | A public base class with nothing to justify it yet |
