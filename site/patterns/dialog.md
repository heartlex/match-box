---
layout: layout.njk
title: Dialog
---

# Dialog

A modal dialog on the native `<dialog>` element. The browser provides the
focus trap, inert background, Escape, and focus restore; match-box adds open
state, outside-click dismissal, and `returnValue`.

## Layer 1: state

```js
import { DialogState } from 'match-box/core';

const state = new DialogState();
state.subscribe(() => console.log(state.open, state.returnValue));
state.show();
state.close('confirm');
```

## Layer 2: attach to the DOM

```js
import { attachDialog } from 'match-box/core';

const { state, dispose } = attachDialog({ dialog, title }, { dismissOnOutsideClick: true });
openButton.addEventListener('click', () => state.show());
```

It writes the label reference on the dialog and calls `showModal()` and
`close()`. A `<form method="dialog">` inside sets `state.returnValue`.

## Lit controller

```js
import { LitElement, html } from 'lit';
import { DialogController } from 'match-box/lit';

class ConfirmOrder extends LitElement {
  dialog = new DialogController(this, () => ({
    dialog: this.renderRoot.querySelector('dialog'),
    title: this.renderRoot.querySelector('h2'),
  }));

  render() {
    return html`<button @click=${() => this.dialog.state.show()}>Place order</button>
      <dialog>
        <h2>Confirm order</h2>
        <form method="dialog"><button value="confirm">Confirm</button></form>
      </dialog>`;
  }
}
```

## Plain HTML

<div class="demo" id="demo"></div>
<script type="module">
  import { mountDialog } from '/demos/demos.js';
  mountDialog(document.getElementById('demo'));
</script>
