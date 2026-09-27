# match-box

A design system built on Lit whose accessible behaviors do not depend on Lit.
The headless core works from plain HTML, any framework, or Lit; Lit is the
first adapter, not the foundation.

It ships design tokens with five color roles, the headless core (listbox,
disclosure, accordion, and native dialog behaviors), the Lit adapter
(controllers plus `FormAssociated` and `DelegatesFocus` mixins),
conformance test suites, and styled components: `mb-button`,
`mb-disclosure`, `mb-accordion`, `mb-dialog`, `mb-listbox`.

## Install

```sh
npm install match-box
```

| Import | Contents |
|---|---|
| `match-box/core` | State classes, `attachX` DOM behaviors, accessibility utilities |
| `match-box/core/testing` | Conformance suites for Mocha and Chai (needs `chai`) |
| `match-box/lit` | Reactive controllers and mixins (needs `lit`) |
| `match-box/components` | Component classes, unregistered (needs `lit`) |
| `match-box/components/define/<name>.js` | Registers `<mb-name>` (and what it needs); `all.js` registers everything |
| `match-box/tokens.css` | Light and dark design tokens |

```html
<script type="module">
  import 'match-box/components/define/all.js';
</script>
<link rel="stylesheet" href="node_modules/match-box/dist/tokens/tokens.css" />

<mb-listbox label="Fruit" name="fruit">
  <mb-option>Apple</mb-option>
  <mb-option selected>Banana</mb-option>
</mb-listbox>
<mb-button color="primary" variant="outline">Save</mb-button>
```

Or use the headless core directly:

```js
import { attachListbox } from 'match-box/core';

const { state, dispose } = attachListbox({ root, label, items: () => [...root.children] });
state.subscribe(() => console.log([...state.selected]));
```

Browser support: the last two versions of evergreen browsers. No polyfills.

## Develop

```sh
npm install
npx playwright install chromium firefox webkit
npm test          # unit tests in Node, browser tests in Chromium, Firefox, WebKit
npm run lint
npm run typecheck
npm run size      # bundle size per subpath against size-budget.json
npm run docs      # builds the site into _site
```

Design: [docs/superpowers/specs/2026-09-18-match-box-design.md](docs/superpowers/specs/2026-09-18-match-box-design.md).
Styling contract for the future skin: [docs/styling-contract.md](docs/styling-contract.md).

## License

MIT
