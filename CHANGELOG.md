# Changelog

This project follows semantic versioning. During `0.x`, a minor version may
include breaking changes; they are listed under **Breaking**.

## 0.2.2

### Fixed

- The docs site renders component API descriptions as Markdown, so code
  spans no longer show as backticks or double-escaped HTML.

## 0.2.1

### Fixed

- `mb-button` takes `name` and `value` and submits them as a native submit
  button does. In a `<form method="dialog">` inside `mb-dialog`, a submit
  `mb-button` now closes the dialog with its `value` as `returnValue`.
- The dialog demo styles its Delete action with `mb-button`.

## 0.2.0

### Added

- Styled components in `match-box/components`: `mb-button`, `mb-disclosure`,
  `mb-accordion`, `mb-dialog`, `mb-listbox`, and `mb-option`. Importing the
  classes registers nothing; `match-box/components/define/<name>.js`
  registers a tag, and `define/all.js` registers every tag.
- Five color roles, `neutral`, `primary`, `secondary`, `tertiary`, and
  `danger`, each six tokens: `--mb-color-<role>-solid`, `-solid-hover`,
  `-on-solid`, `-text`, `-subtle`, and `-border`, in light and dark.
- Core: `AccordionState`, `attachAccordion`, the `accordionConformance`
  suite, `ListboxState.setMultiple`, and `containsComposed` in
  `core/testing`. `attachDialog` accepts a function for
  `dismissOnOutsideClick`, and restores modality when an open dialog is
  moved.
- Lit: `AccordionController`.
- `custom-elements.json`, referenced by `package.json`'s `customElements`
  field, for editor autocompletion.

### Breaking

The color roles replace these tokens:

| Removed token | Use instead |
|---|---|
| `--mb-color-bg-accent` | `--mb-color-primary-solid` |
| `--mb-color-bg-accent-hover` | `--mb-color-primary-solid-hover` |
| `--mb-color-fg-on-accent` | `--mb-color-primary-on-solid` |
| `--mb-color-fg-accent` | `--mb-color-primary-text` |
| `--mb-color-bg-danger` | `--mb-color-danger-solid` |
| `--mb-color-fg-danger` | `--mb-color-danger-text` |
| `--mb-color-border-danger` | `--mb-color-danger-border` |

The unused primitive `--mb-red-500` is removed. Primitives are not public
API.

## 0.0.0

First version, not published to npm: tokens, the headless core (listbox,
disclosure, dialog), the Lit adapter, and conformance suites.
