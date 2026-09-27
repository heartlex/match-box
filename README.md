# match-box

A design system built on Lit whose accessible behaviors do not depend on Lit.
The headless core works from plain HTML, any framework, or Lit; Lit is the
first adapter, not the foundation.

v1 ships foundations only: design tokens, the headless core (listbox,
disclosure, and native dialog behaviors), the Lit adapter (controllers plus
`FormAssociated` and `DelegatesFocus` mixins), and conformance test suites.
Styled components arrive in v2.

## Install

```sh
npm install match-box
```

| Import | Contents |
|---|---|
| `match-box/core` | State classes, `attachX` DOM behaviors, accessibility utilities |
| `match-box/core/testing` | Conformance suites for Mocha and Chai (needs `chai`) |
| `match-box/lit` | Reactive controllers and mixins (needs `lit`) |
| `match-box/tokens.css` | Light and dark design tokens |

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
