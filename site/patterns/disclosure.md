---
layout: layout.njk
title: Disclosure
---

# Disclosure

A button that shows and hides a panel, following the WAI-ARIA disclosure
pattern.

## Layer 1: state

```js
import { DisclosureState } from 'match-box/core';

const state = new DisclosureState({ expanded: false });
state.subscribe(() => console.log(state.expanded));
state.toggle();
```

## Layer 2: attach to the DOM

```js
import { attachDisclosure } from 'match-box/core';

const { state, dispose } = attachDisclosure({ trigger, panel });
state.subscribe(() => {
  panel.hidden = !state.expanded;
});
```

It writes `aria-expanded` and the controls reference on the trigger, plus
`role="button"` and `tabindex="0"` if the trigger is not a `<button>`. Showing
and hiding the panel is the template's job.

## Lit controller

```js
import { LitElement, html } from 'lit';
import { DisclosureController } from 'match-box/lit';

class ShippingDetails extends LitElement {
  disclosure = new DisclosureController(this, () => ({
    trigger: this.renderRoot.querySelector('button'),
    panel: this.renderRoot.querySelector('div'),
  }));

  render() {
    return html`<button type="button">Shipping details</button>
      <div ?hidden=${!this.disclosure.state.expanded}>Ships in two days.</div>`;
  }
}
```

## Plain HTML

<div class="demo" id="demo"></div>
<script type="module">
  import { mountDisclosure } from 'demos/demos.js';
  mountDisclosure(document.getElementById('demo'));
</script>
