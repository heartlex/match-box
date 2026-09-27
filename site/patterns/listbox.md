---
layout: layout.njk
title: Listbox
---

# Listbox

Roving tabindex, single and multiple selection, typeahead, and disabled
options, following the WAI-ARIA listbox pattern.

## Layer 1: state

```js
import { ListboxState } from 'match-box/core';

const state = new ListboxState({ multiple: false });
state.setItems([
  { key: 'apple', label: 'Apple' },
  { key: 'cherry', label: 'Cherry', disabled: true },
]);
state.subscribe(() => console.log(state.activeIndex, [...state.selected]));
state.moveNext();
state.selectActive();
```

## Layer 2: attach to the DOM

```js
import { attachListbox } from 'match-box/core';

const { state, sync, dispose } = attachListbox(
  { root, label, items: () => [...root.children] },
  { multiple: true },
);
```

It writes `role`, `aria-multiselectable`, `aria-selected`, `aria-disabled`,
`tabindex`, and the label reference. Your template owns everything else.
Call `sync()` after changing the options.

## Lit controller

```js
import { LitElement, html } from 'lit';
import { ListboxController } from 'match-box/lit';

class FruitPicker extends LitElement {
  listbox = new ListboxController(this, () => ({
    root: this.renderRoot.querySelector('[part=listbox]'),
    label: this.renderRoot.querySelector('[part=label]'),
    items: () => [...this.renderRoot.querySelectorAll('[part=option]')],
  }));

  render() {
    return html`<span part="label">Fruit</span>
      <div part="listbox"><div part="option">Apple</div><div part="option">Banana</div></div>`;
  }
}
```

## Plain HTML

<div class="demo" id="demo"></div>
<script type="module">
  import { mountListbox } from '/demos/demos.js';
  mountListbox(document.getElementById('demo'), {
    multiple: false,
    options: [{ label: 'Apple' }, { label: 'Banana' }, { label: 'Cherry', disabled: true }, { label: 'Date' }],
  });
</script>
