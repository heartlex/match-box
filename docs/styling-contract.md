# Styling contract for the match-box skin

Status: v1. No code implements this yet. It exists so that decisions in
`match-box/core` do not box in the styled components planned for v2.

## Customization surfaces

Use them in this order. Each one is part of the public API and follows
semver.

1. **Tokens.** Every visual property of a component reads a component token,
   such as `--mb-button-bg`, which defaults to a semantic token, such as
   `--mb-color-bg-accent`. Consumers override component tokens per subtree
   and semantic tokens per theme.
2. **Parts.** Each component exposes a documented, stable set of `part`
   names. Adding a part is a minor version. Removing or renaming one is a
   major version.
3. **Slots.** Named slots accept consumer content and always have default
   content.

A consumer who needs a different structure uses `match-box/core` directly
and renders their own markup. The skin ships no `unstyled` attribute and no
global style injection.

## Rules for every component

- Shadow DOM, always.
- `delegatesFocus` on any component that contains a focusable element, via
  the `DelegatesFocus` mixin.
- State is reflected through attributes and custom states (`:state(...)`),
  so parts can be styled by condition. The core behaviors write only ARIA
  attributes and `tabindex`; styling hooks come from the template.
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
