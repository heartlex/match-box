# match-box v2 step 1 follow-ups: size, motion, link buttons

Date: 2026-09-28
Status: approved for planning
Builds on: `docs/superpowers/specs/2026-09-27-match-box-v2-step1-design.md`

## 1. Purpose and scope

Step 1 shipped five styled components and left four items out on purpose.
This release adds three of them and closes a documentation gap:

| Item | Result |
|---|---|
| `size` | A `size` attribute on the controls and the dialog, backed by one size scale in the tokens |
| Motion | Transitions and entry animations in every component, driven by motion tokens, off under reduced motion |
| `href` buttons | `mb-button` renders a link when given `href` |
| `mb-dialog` doc comments | `show()` and `close()` get descriptions in the API tables |

It ships as `0.3.0`. The roadmap moves:

| Release | Content |
|---|---|
| `0.3.0` (this spec) | Size, component motion, link buttons |
| `0.4.0` | Motion sub-project: `match-box/motion`, helpers for applications (scroll reveal, layout transitions, sequencing) on the native APIs. Its own spec. |
| `0.5.0` | Step 2 form controls: text field, checkbox, switch |
| Later | Step 3 select, step 4 combobox, as before |

Success means:

- every component renders in `sm`, `md`, and `lg`, and a theme retunes a
  size once for all of them;
- every animation reads a token, and none runs under
  `prefers-reduced-motion: reduce`;
- a link button behaves as a native link in all three engines;
- every existing conformance suite, axe audit, and styling test still
  passes on Chromium, Firefox, and WebKit.

### Non-goals

- Visual-regression screenshots. Dropped, see section 7.
- Animating an option's removal from a listbox. Removal is synchronous DOM;
  exit animations belong to the motion sub-project.
- A text-link look (`variant="link"`) for `mb-button`.
- A page-wide density setting. `size` is per component.
- An animation library. See section 7.

## 2. Size

### API

- `size`: `sm`, `md` (default), or `lg`. Unknown values render as `md`.
  Not reflected, like `color` and `variant`, so hosts gain no attributes
  they were not given.
- Components:

| Component | Effect of `size` |
|---|---|
| `mb-button` | Height, horizontal padding, font size, gap, icon size |
| `mb-disclosure` | Trigger height, padding, font size, gap, chevron size; panel horizontal padding |
| `mb-accordion` | Sets `size` on each disclosure that has no `size` attribute of its own, as `heading-level` does today |
| `mb-listbox` | Every option's height, padding, font size, gap, checkmark size. Custom properties inherit into slotted `mb-option`s, so `mb-option` has no `size` |
| `mb-dialog` | Width |

### Tokens

One scale, defined once in `tokens.css`, the same in both themes:

| Token | `sm` | `md` | `lg` |
|---|---|---|---|
| `--mb-size-<s>-height` | `1.75rem` | `2.25rem` | `2.75rem` |
| `--mb-size-<s>-padding-inline` | `var(--mb-space-2)` | `var(--mb-space-3)` | `var(--mb-space-4)` |
| `--mb-size-<s>-font-size` | `var(--mb-font-size-1)` | `var(--mb-font-size-2)` | `var(--mb-font-size-3)` |
| `--mb-size-<s>-gap` | `var(--mb-space-1)` | `var(--mb-space-2)` | `var(--mb-space-2)` |
| `--mb-size-<s>-icon` | `0.875rem` | `1rem` | `1.25rem` |

- New primitive: `--mb-font-size-3: 1.125rem`.
- Dialog widths: `--mb-dialog-width-sm: 24rem`, `--mb-dialog-width-md:
  32rem`, `--mb-dialog-width-lg: 48rem`. The existing `--mb-dialog-width`
  overrides whichever size is set.

### Styles

- `src/components/shared/styles.ts` gains `sizeStyles`, which maps a
  `.size-<s>` class to private `--_height`, `--_padding-inline`,
  `--_font-size`, `--_gap`, and `--_icon`, the way `colorRoleStyles` maps
  `.color-<role>`. Components always render an explicit class,
  `size-md` included.
- `src/components/shared/size.ts` exports `sizes` and a `size(value)`
  normalizer, like `color.ts`.
- Component tokens keep winning:
  `min-block-size: var(--mb-button-height, var(--_height))`. New
  component tokens where a sized property had none:
  `--mb-disclosure-height`, `--mb-disclosure-font-size`,
  `--mb-disclosure-gap`, `--mb-option-height`, `--mb-option-font-size`,
  `--mb-option-icon-size`, `--mb-button-icon-size`,
  `--mb-disclosure-icon-size`.

### Changed at the default size

The button, the disclosure trigger, and the option share the control
height, as `min-block-size` so wrapped text still grows. At `md`:

- `mb-button`: unchanged, `2.25rem`.
- `mb-option`: from `2rem` to `2.25rem`.
- `mb-disclosure` trigger: from `2.5rem` to `2.25rem`; its default
  vertical padding drops from `var(--mb-space-stack-md)` to
  `var(--mb-space-stack-sm)` so the height can shrink.
- `mb-option` and `mb-disclosure` (trigger and panel): horizontal padding
  from `0.5rem` to `0.75rem`, the scale's `md` value.
- `mb-disclosure` trigger: gap from `0.75rem` to `0.5rem`.

Listed under **Changed** in `CHANGELOG.md`, as allowed in `0.x`.

## 3. Motion

### Tokens

| Token | Value |
|---|---|
| `--mb-motion-duration-fast` | `120ms` (colors) |
| `--mb-motion-duration-medium` | `200ms` (panels, backdrop) |
| `--mb-motion-duration-slow` | `300ms` (dialog) |
| `--mb-motion-easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--mb-motion-easing-enter` | `cubic-bezier(0, 0, 0, 1)` |
| `--mb-motion-easing-exit` | `cubic-bezier(0.3, 0, 1, 1)` |
| `--mb-motion-easing-spring` | `linear(0, 0.058 5%, 0.193 10%, 0.358 15%, 0.523 20%, 0.671 25%, 0.793 30%, 0.886 35%, 0.953 40%, 0.997 45%, 1.023 50%, 1.036 55%, 1.04 60%, 1.038 65%, 1.032 70%, 1.026 75%, 1.019 80%, 1.013 85%, 1.008 90%, 1.005 95%, 1)`, sampled from a damped spring (damping ratio 0.716) that overshoots by 4% |

- `tokens.css` sets every duration to `0ms` under
  `@media (prefers-reduced-motion: reduce)`. A theme turns motion off the
  same way.
- Each effect also has a component token that defaults to the shared one,
  e.g. `--mb-dialog-duration`, `--mb-disclosure-duration`,
  `--mb-button-press-scale`.

### Per component

| Component | Motion |
|---|---|
| `mb-button` | Background, text, and border colors transition (`fast`). `:active` scales to `--mb-button-press-scale` (`0.97`). Slotted prefix and suffix fade in. |
| `mb-disclosure` | The panel opens and closes (`medium`); its content fades in and moves up `0.25rem`. The chevron rotates on the spring easing. |
| `mb-accordion` | Nothing of its own. Closing and opening panels animate together because each disclosure runs its own transition. |
| `mb-dialog` | Opens from scale `0.96` and opacity 0 on the spring easing (`slow`), via `@starting-style`. The backdrop fades and blurs (`--mb-dialog-backdrop-blur`, `2px`). Closes with `transition-behavior: allow-discrete` on `display` and `overlay`. Firefox has no `overlay` transition yet, so there the close is instant and the open animates. `close` and `returnValue` keep their timing. |
| `mb-listbox` | Selection background and checkmark transition (`fast`). Options added after the first render fade in and move up (`medium`), via `element.animate()`. |

### Disclosure panel structure

Today the template toggles `hidden` on the panel, which is `display: none`
and cannot animate. The panel becomes a grid:

- `[part=panel]` is `display: grid` with `grid-template-rows: 1fr` when
  open and `0fr` plus `visibility: hidden` when closed. Both transition.
  An inner wrapper without a part has `min-block-size: 0` and
  `overflow: hidden`.
- `visibility: hidden` keeps a closed panel out of the tab order and the
  accessibility tree in all three engines, as `hidden` did. It applies at
  the end of the closing transition.
- The template stops writing `hidden` on the panel. The core never wrote
  it (`src/core/dom/disclosure.ts`), so the core behaviors, the
  controllers, and the headless patterns do not change. The `panel` part
  keeps its name.
- The disclosure and accordion conformance suites in `core/testing` check
  `panel.checkVisibility({ visibilityProperty: true })` instead of
  `checkVisibility()`, which ignores `visibility: hidden`. A panel hidden
  with `hidden` or `display: none` still passes, so the change is backward
  compatible for consumers of the suites.

### Listbox entry animation

- On `slotchange`, `mb-listbox` animates options it has not seen before.
  Options present at the first render are marked seen without animating.
- It reads the duration and easing from the computed style of the
  listbox and skips `animate()` when the duration is `0ms`, so reduced
  motion never starts an animation.

## 4. Link buttons

- `mb-button` gains `href`, `target`, `rel`, and `download`. With `href`
  set it renders `<a part="base">` instead of `<button part="base">`, with
  the same classes, slots, and parts, and passes the four attributes
  through.
- With `href`, `type`, `name`, and `value` are ignored and a click never
  submits or resets a form. Keyboard and role are the native link's: Enter
  activates, Space does not.
- `disabled` with `href`: `<a>` without `href`, with `role="link"`,
  `aria-disabled="true"`, and `tabindex="-1"`. Disabled styling; no
  navigation; not focusable, like a disabled `mb-button`.
- Links get `text-decoration: none` and no visited color. The look comes
  from the button tokens in every variant, color, and size.
- `DelegatesFocus` focuses the link when the host is focused.

## 5. `mb-dialog` doc comments

- `show()`: "Opens the dialog modally and clears `returnValue`."
- `close(returnValue?)`: "Closes the dialog. `returnValue` becomes the
  given value, or empty."

The manifest and the API tables pick them up.

## 6. Testing

| Level | What |
|---|---|
| Test setup | A stylesheet loaded by the browser tests sets every motion duration to `0ms`. Motion tests remove it. |
| Size | Each component resolves each size to the scale tokens (computed styles); a component token still wins; unknown values render as `md`; accordion and listbox pass size to their children, and a disclosure's own `size` wins in an accordion; dialog width follows `size` and `--mb-dialog-width` wins; `sm` controls are at least 24 × 24 px (WCAG 2.5.8). |
| Motion | Each effect reads its token; `emulateMedia({ reducedMotion: 'reduce' })` computes every duration to `0s`; a closed panel is not focusable and not in the accessibility tree; the listbox animates options added after the first render, not those present at it, and never calls `animate()` at `0ms`; the dialog still closes with the right `returnValue`. |
| Link buttons | Renders `<a>` with the four attributes; navigates on click and Enter, not Space; never submits its form, even with `type="submit"`; disabled has no `href`, is `aria-disabled`, not focusable, and does not navigate; host focus reaches the link. |
| Accessibility | axe for every size of every component, and for link buttons, in both themes. |
| Existing | Conformance suites, forms, styling contract, forced colors: passing. Assertions that read the panel's `hidden` attribute check its visibility and focusability instead; nothing else changes. |

## 7. Decisions log

| Decision | Alternatives rejected | Reason |
|---|---|---|
| Per-component `size` | Page-wide density; both | The need is a small button in a toolbar, not a dense page; least API |
| One size scale, mapped by class (approach A) | Tokens per component and size; `em` scaling | Mirrors the color roles: a theme retunes a size once; about five tokens per size |
| Shared control height at `md` | Keep three different heights | One scale cannot reproduce all three; controls line up |
| `size` on `mb-dialog` means width | Leave the dialog out | Requested; its own width scale keeps the control scale about controls |
| CSS and `element.animate()` | GSAP; Motion | GSAP alone is about 25 KB gzip against a 9.6 KB component budget; tokens could not retune it; native APIs handle shadow DOM, the top layer, and the accessibility tree |
| Grid panel with `visibility: hidden` | `interpolate-size`; `hidden` with no animation | Animates in all three engines today; stays out of the accessibility tree |
| Entry-only listbox animation | Delaying `remove()` | Delaying removal would make a synchronous DOM call asynchronous |
| No visual-regression screenshots | Linux-container baselines | Computed-style and axe tests cover correctness; not worth Docker and baseline upkeep yet |
| Motion helpers for applications as their own sub-project | In this release | A new public subpath with its own API, docs, and tests |

## 8. Budgets and docs

- `size-budget.json`: `match-box/components` and
  `match-box/components/define/all.js` rise to the measured size rounded
  up to the next 100 B, at most `10600`; `match-box/tokens.css` to at most
  `1800`.
- Docs: each component page gains a size demo; the button page gains a
  link-button demo; the Theming page documents the size scale and the
  motion tokens, and how to turn motion off.
- `docs/styling-contract.md`: removes "No `size` attribute in the first
  skin release"; adds the size scale, the motion tokens, and the
  reduced-motion rule; notes that applications can drive their own
  animation library by setting the durations to `0ms` and hooking the
  `open` state and the `close` event.
