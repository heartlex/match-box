---
layout: layout.njk
title: Home
---

# match-box

A headless behavior layer for accessible widgets, with Lit as its first
adapter. v1 ships foundations only: tokens, the core layers, the Lit adapter,
and conformance suites.

```sh
npm install match-box
```

| Subpath | Contents |
|---|---|
| `match-box/core` | State, DOM behaviors, and accessibility utilities. No dependencies. |
| `match-box/core/testing` | Conformance suites for Mocha and Chai. |
| `match-box/lit` | Reactive controllers and the `FormAssociated` and `DelegatesFocus` mixins. |
| `match-box/tokens.css` | Design tokens, light and dark. |

Patterns: [Listbox](/patterns/listbox/), [Disclosure](/patterns/disclosure/),
[Dialog](/patterns/dialog/). Full reference: [API](/api/). Every component,
pattern, and motion helper is also in [Storybook](/storybook/).
