---
layout: layout.njk
title: Dialog
api: [mb-dialog]
---

# Dialog

```js
import 'match-box/components/define/dialog.js';
```

<div class="demo">
  <mb-button color="danger" id="open-dialog">Delete project</mb-button>
  <mb-dialog label="Delete project?" size="sm" id="demo-dialog">
    <p>This removes the project and its history.</p>
    <form method="dialog" slot="footer">
      <mb-button type="submit" variant="ghost">Cancel</mb-button>
      <mb-button type="submit" color="danger" value="delete">Delete</mb-button>
    </form>
  </mb-dialog>
  <p>Returned: <output id="dialog-result"></output></p>
</div>
<script type="module">
  const dialog = document.getElementById('demo-dialog');
  document.getElementById('open-dialog').addEventListener('click', () => dialog.show());
  dialog.addEventListener('close', () => {
    document.getElementById('dialog-result').value = dialog.returnValue || '(dismissed)';
  });
</script>

```html
<mb-dialog label="Delete project?">
  <p>This removes the project and its history.</p>
  <form method="dialog" slot="footer">
    <mb-button type="submit" variant="ghost">Cancel</mb-button>
    <mb-button type="submit" color="danger" value="delete">Delete</mb-button>
  </form>
</mb-dialog>
```

A `<form method="dialog">` inside closes the dialog with the submit
button's `value` as `returnValue`; a submit `mb-button` works like a native
one. A dismissal (Escape, outside click, the
close button) leaves `returnValue` empty.

`size` sets the width: `sm` 24rem, `md` 32rem (default), `lg` 48rem.

{% include "api.njk" %}
