---
layout: layout.njk
title: Theming
---

# Theming

Every component takes a `color`: `neutral` (default), `primary`,
`secondary`, `tertiary`, or `danger`. Each role is six tokens, and every
component and variant reads them:

| Token | Used for |
|---|---|
| `--mb-color-<role>-solid` | Filled backgrounds |
| `--mb-color-<role>-solid-hover` | Filled backgrounds on hover |
| `--mb-color-<role>-on-solid` | Text and icons on `solid` |
| `--mb-color-<role>-text` | Text on a surface |
| `--mb-color-<role>-subtle` | Tinted backgrounds: hover, selected options |
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
    --mb-color-primary-on-solid: #ffffff;
    --mb-color-primary-text: #b3261e;
    --mb-color-primary-subtle: #fceeee;
    --mb-color-primary-border: #b3261e;
  }
</style>

## Set a role for your brand

Override the six tokens once, on `:root` or any subtree. Define light and
dark values; keep `on-solid` and `text` at 4.5:1 or more against their
backgrounds, and `border` at 3:1 against the surface.

```css
:root {
  --mb-color-primary-solid: #b3261e;
  --mb-color-primary-solid-hover: #8c1d18;
  --mb-color-primary-on-solid: #ffffff;
  --mb-color-primary-text: #b3261e;
  --mb-color-primary-subtle: #fceeee;
  --mb-color-primary-border: #b3261e;
}
```

## Adjust one component

Component tokens override a single component, on the element or any
ancestor: `mb-button { --mb-button-radius: 999px; }`. Each component page
lists its tokens. For anything else, style its parts:
`mb-dialog::part(title) { font-size: 1.5rem; }`.

## Light and dark

Set `data-theme="light"` or `data-theme="dark"` on any element. Without
it, the page follows the system preference.

## Sizes

`size` is `sm`, `md` (default), or `lg` on buttons, disclosures,
accordions, and listboxes. Each size is five tokens; retune a size once and
every component follows.

| Token | `sm` | `md` | `lg` |
|---|---|---|---|
| `--mb-size-<s>-height` | 1.75rem | 2.25rem | 2.75rem |
| `--mb-size-<s>-padding-inline` | 0.5rem | 0.75rem | 1rem |
| `--mb-size-<s>-font-size` | 0.875rem | 1rem | 1.125rem |
| `--mb-size-<s>-gap` | 0.25rem | 0.5rem | 0.5rem |
| `--mb-size-<s>-icon` | 0.875rem | 1rem | 1.25rem |

`mb-dialog` sizes its width from `--mb-dialog-width-sm`, `-md`, and `-lg`.

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
