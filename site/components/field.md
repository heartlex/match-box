---
layout: layout.njk
title: Field
api: [mb-field]
---

# Field

```js
import 'match-box/components/define/all.js';
```

<div class="demo">
  <form id="field-demo" style="display: grid; gap: 1rem; max-inline-size: 24rem;">
    <mb-field label="Email" description="We never share it."><mb-input type="email" name="email" required></mb-input></mb-field>
    <mb-field label="Username" error="That name is taken."><mb-input name="user" value="ada"></mb-input></mb-field>
    <div class="row"><mb-button type="submit" color="primary">Send</mb-button><mb-button type="reset" variant="ghost">Reset</mb-button></div>
  </form>
</div>
<script type="module">
  document.getElementById('field-demo').addEventListener('submit', (event) => event.preventDefault());
</script>

```html
<mb-field label="Email" description="We never share it.">
  <mb-input type="email" name="email" required></mb-input>
</mb-field>
```

`mb-field` labels and describes the control inside it and shows an error:
the `error` you set, or the control's validation message once the user
changed the control and left it, or a submit was attempted. It works
around `mb-input`, `mb-checkbox`, `mb-switch`, `mb-checkbox-group`, and
`mb-listbox`. Clicking the label focuses the control.

{% include "api.njk" %}
