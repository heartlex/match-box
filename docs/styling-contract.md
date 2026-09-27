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
