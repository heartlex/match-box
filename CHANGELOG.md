# Changelog

This project follows semantic versioning. During `0.x`, a minor version may
include breaking changes; they are listed under **Breaking**.

## 0.5.0

### Added

- `mb-field`: a label, description, and error around any form control,
  connected to it. It shows its `error`, or the control's validation
  message once the user changed the control and left it, or a submit was
  attempted.
- `mb-input`: text, email, password, search, tel, url, and number inputs
  with `prefix` and `suffix` slots; validity and messages match `<input>`.
  A `readonly` field is not validated, like `<input readonly>`; a number
  field reports `badInput`; Enter submits through the form's default
  submit button, if any (a disabled default button blocks it, and its
  `name`/`value` are submitted).
- `mb-checkbox` (with `indeterminate`), `mb-switch`, and
  `mb-checkbox-group` (submits the checked values; `required` means at
  least one; optional "select all"). `mb-checkbox` and `mb-switch` keep a
  property-set `value` across a form reset, keep `checked` set before the
  element connects, and toggle on `click()`. A disabled checkbox in a
  group is not submitted and does not count towards "at least one"; a
  checkbox inside a group does not validate on its own.
- `mb-listbox` takes its name, description, and error from an `mb-field`.
- Core: `attachField`, `CheckboxGroupState`, `attachCheckboxGroup`.
- `core/testing`: `fieldConformance`, `checkboxGroupConformance`,
  `nameOf`, `referencedText`.
- `match-box/lit`: protected hooks on `FormAssociated` (`isEmpty`,
  `requiredMessage`, `intrinsicValidity`, `validationAnchor`,
  `revalidate`, `markEdited`) and the `FormAssociatedHooks` type.

### Changed

- `mb-button`'s `click()` now activates it like a native button; it did
  nothing before.
- `mb-input`, `mb-checkbox`, `mb-switch`, and `mb-field` pin `line-height`
  and `letter-spacing`, so page CSS no longer changes them.

## 0.4.0

### Added

- `match-box/motion`: `reveal` animates elements the first time they enter
  the viewport; `stagger` plays one animation on a group, offset in time;
  `flip` animates elements from their old layout to the new one after a
  DOM change; `exit` animates an element out, then removes it. Durations
  and easings come from the motion tokens; nothing animates under
  `prefers-reduced-motion: reduce`; an `AbortSignal` jumps to the end.

## 0.3.0

### Added

- `size` (`sm`, `md`, `lg`) on `mb-button`, `mb-disclosure`,
  `mb-accordion` (for disclosures without their own), `mb-listbox` (for
  its options), and `mb-dialog` (width). Tokens: `--mb-size-<s>-height`,
  `-padding-inline`, `-font-size`, `-gap`, `-icon`;
  `--mb-dialog-width-<s>`; `--mb-font-size-3`.
- Motion: color transitions, press feedback, animated disclosure panels,
  dialog entry and exit, and entry animation for options added to a
  listbox. Tokens: `--mb-motion-duration-fast`, `-medium`, `-slow`;
  `--mb-motion-easing-standard`, `-enter`, `-exit`, `-spring`. Every
  duration is `0ms` under `prefers-reduced-motion: reduce`.
- `mb-button` renders a link with `href`, and takes `target`, `rel`, and
  `download`.
- `mb-dialog`'s `show()` and `close()` are documented.

### Changed

- At the default size, `mb-option` is `2.25rem` tall (was `2rem`) and the
  `mb-disclosure` trigger is `2.25rem` (was `2.5rem`). Both use `0.75rem`
  horizontal padding (was `0.5rem`); the disclosure trigger's gap is
  `0.5rem` (was `0.75rem`).
- `mb-disclosure`'s panel no longer has a `hidden` attribute when closed;
  it hides with `visibility: hidden`.
- The disclosure and accordion conformance suites in `core/testing` check
  `checkVisibility({ visibilityProperty: true })`.

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
