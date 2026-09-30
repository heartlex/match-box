---
layout: layout.njk
title: Theming
---

# Theming

Every component takes a `color`: `neutral` (default), `primary`,
`secondary`, `tertiary`, or `danger`. Each role is eight tokens, and every
component and variant reads them:

| Token | Used for |
|---|---|
| `--mb-color-<role>-solid` | Filled backgrounds |
| `--mb-color-<role>-solid-hover` | Filled backgrounds on hover |
| `--mb-color-<role>-solid-active` | Filled backgrounds while pressed |
| `--mb-color-<role>-on-solid` | Text and icons on `solid` |
| `--mb-color-<role>-text` | Text on a surface |
| `--mb-color-<role>-subtle` | Tinted backgrounds: hover, selected options |
| `--mb-color-<role>-subtle-active` | Tinted backgrounds while pressed (outline and ghost buttons), disabled checked controls |
| `--mb-color-<role>-border` | Outlines |

<div class="demo">
  <div class="row">
    <mb-button color="primary">Primary</mb-button>
    <mb-button color="secondary">Secondary</mb-button>
    <mb-button color="tertiary">Tertiary</mb-button>
    <mb-button color="danger">Danger</mb-button>
  </div>
  <div class="row brand">
    <mb-button color="primary">Rebranded primary</mb-button>
    <mb-button color="primary" variant="outline">Rebranded primary</mb-button>
  </div>
</div>
<style>
  .brand {
    --mb-color-primary-solid: #b3261e;
    --mb-color-primary-solid-hover: #8c1d18;
    --mb-color-primary-solid-active: #6f1512;
    --mb-color-primary-on-solid: #ffffff;
    --mb-color-primary-text: #b3261e;
    --mb-color-primary-subtle: #fceeee;
    --mb-color-primary-subtle-active: #f8dcda;
    --mb-color-primary-border: #b3261e;
  }
</style>

## Set a role for your brand

Override the eight tokens once, on `:root` or any subtree. Define light and
dark values; keep `on-solid` and `text` at 4.5:1 or more against their
backgrounds, and `border` at 3:1 against the surface.

```css
:root {
  --mb-color-primary-solid: #b3261e;
  --mb-color-primary-solid-hover: #8c1d18;
  --mb-color-primary-solid-active: #6f1512;
  --mb-color-primary-on-solid: #ffffff;
  --mb-color-primary-text: #b3261e;
  --mb-color-primary-subtle: #fceeee;
  --mb-color-primary-subtle-active: #f8dcda;
  --mb-color-primary-border: #b3261e;
}
```

## Adjust one component

Component tokens override a single component, on the element or any
ancestor: `mb-button { --mb-button-radius: 999px; }`. Each component page
lists its tokens. For anything else, style its parts:
`mb-dialog::part(title) { font-size: 1.5rem; }`. Form controls follow the
same rule: `--mb-input-*`, `--mb-checkbox-*`, `--mb-switch-*`, and
`--mb-field-*` override one component; the color roles and the size scale
supply their defaults.

## Light and dark

Set `data-theme="light"` or `data-theme="dark"` on any element. Without
it, the page follows the system preference.

## Fonts

The skin asks for Aeonik, then Geist, then the system font. Geist, a free
stand-in, ships as a separate file:

```js
import 'match-box/tokens.css';
import 'match-box/fonts.css'; // optional: Geist
```

With an Aeonik license, load Aeonik yourself and skip `fonts.css`. To use
another font, set `--mb-font-family-body`.

## Status colors

`--mb-color-fg-success`, `-warning`, `-danger` are text colors, and
`--mb-color-bg-success`, `-warning`, `-danger` the matching backgrounds
(`mb-field` uses the danger pair for its error banner). Every pair meets
WCAG AA contrast in both themes.

## Sizes

`size` is `sm`, `md` (default), or `lg` on buttons, disclosures,
accordions, and listboxes. Each size is five tokens; retune a size once and
every component follows. `mb-input`, `mb-checkbox`, and `mb-switch` follow
only the height, font-size, and gap of the scale, with their own padding
and box/track sizes.

| Token | `sm` | `md` | `lg` |
|---|---|---|---|
| `--mb-size-<s>-height` | 2rem | 2.5rem | 3rem |
| `--mb-size-<s>-padding-inline` | 0.75rem | 1rem | 1.5rem |
| `--mb-size-<s>-font-size` | 0.75rem | 0.875rem | 1rem |
| `--mb-size-<s>-gap` | 0.5rem | 0.5rem | 0.5rem |
| `--mb-size-<s>-icon` | 1rem | 1.25rem | 1.5rem |

`mb-dialog` sizes its width from `--mb-dialog-width-sm`, `-md`, and `-lg`.

## Corners

| Token | Value | Used by |
|---|---|---|
| `--mb-radius-control` | 0.75rem (12px) | Buttons, inputs, listbox options |
| `--mb-radius-surface` | 1rem (16px) | Listbox panels, accordions, dialogs |

Checkbox boxes, the check in multi-select listbox options, and the
`mb-field` error banner use a smaller 6px corner. Each component also has
its own radius variable, such as `--mb-checkbox-radius` or
`--mb-listbox-radius`.

## Motion

Every animation reads these tokens. Under `prefers-reduced-motion: reduce`
every duration is `0ms`.

| Token | Default |
|---|---|
| `--mb-motion-duration-fast` | 120ms |
| `--mb-motion-duration-medium` | 200ms |
| `--mb-motion-duration-slow` | 300ms |
| `--mb-motion-easing-standard`, `-enter`, `-exit`, `-spring` | Curves |

Turn motion off everywhere, for example to drive your own animation
library from the `open` state and the `close` event:

```css
:root {
  --mb-motion-duration-fast: 0ms;
  --mb-motion-duration-medium: 0ms;
  --mb-motion-duration-slow: 0ms;
}
```

For motion in your own pages, see [Motion](/motion/).
