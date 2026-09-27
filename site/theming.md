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
