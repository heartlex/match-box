# Styling contract for the match-box skin

Status: 0.5.0. `match-box/components` implements this contract for button,
disclosure, accordion, dialog, listbox, field, input, checkbox, checkbox
group, and switch.

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
  `secondary`, `tertiary`, or `danger`. Each role is eight semantic tokens,
  `--mb-color-<role>-solid`, `-solid-hover`, `-solid-active`, `-on-solid`,
  `-text`, `-subtle`, `-subtle-active`, and `-border`. A theme defines each
  role once; every component and variant follows.
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
  `--mb-focus-ring-width` and `--mb-color-border-focus`. `mb-input` is the
  exception: its 3px halo touches the box and is its role border color at
  20%, and the role-colored border carries the contrast. Every component
  has an `@media (forced-colors: active)` block that keeps borders,
  selection, and focus visible.
- `size` picks a size, `sm`, `md` (default), or `lg`, on components whose
  controls have a height. Each size is five tokens,
  `--mb-size-<s>-height`, `-padding-inline`, `-font-size`, `-gap`, and
  `-icon`; a shared class maps them to private properties, as with color
  roles. `mb-dialog`'s `size` is its width, from `--mb-dialog-width-<s>`.
  `mb-input`, `mb-checkbox`, and `mb-switch` follow only the height,
  font-size, and gap of the scale, with their own padding and box/track
  sizes.
- Motion reads `--mb-motion-duration-*` and `--mb-motion-easing-*`, through
  a component token where one exists. Every duration is `0ms` under
  `prefers-reduced-motion: reduce`. Applications that drive their own
  animation library set the durations to `0ms` and hook the `open` state
  and the `close` event.
- No `margin` on the host element. Layout belongs to the consumer.
- Icons come through a slot. No icon set is bundled.
- Form controls wrap native inputs in shadow DOM. `mb-field` renders the
  label, description, and error in its own shadow root; controls name and
  describe their input from hidden copies of that text in theirs, so page
  CSS reaches neither.
- Form controls (`mb-input`, `mb-checkbox`, `mb-switch`, `mb-listbox`)
  include `neutralAccent`: with no `color`, they take primary's accent.
- Every text/background pair a component draws meets 4.5:1 and every
  border or mark 3:1, in both themes (`test/browser/tokens.test.ts`).
- The skin's font comes from `--mb-font-family-body`; `match-box/fonts.css`
  is optional and only declares `@font-face`.

## Attributes the core writes

Templates must not write these, and styles may select on them.

| Behavior | Element | Attributes |
|---|---|---|
| `attachListbox` | root | `role`, `aria-multiselectable`, `ariaLabelledByElements` |
| `attachListbox` | option | `role`, `aria-selected`, `aria-disabled`, `tabindex` |
| `attachDisclosure` | trigger | `aria-expanded`, `ariaControlsElements`, and `role`, `tabindex` when not a `<button>` |
| `attachDialog` | dialog | `ariaLabelledByElements` |
| `mb-listbox` (via `attachListbox`) | `mb-option` | `role`, `aria-selected`, `aria-disabled`, `tabindex` |
