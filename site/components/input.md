---
layout: layout.njk
title: Input
api: [mb-input]
---

# Input

```js
import 'match-box/components/define/input.js';
```

<div class="demo">
  <div style="display: grid; gap: 1rem; max-inline-size: 20rem;">
    <mb-field label="Name"><mb-input autocomplete="name"></mb-input></mb-field>
    <mb-field label="Price"><mb-input type="number" min="0" step="0.01"><span slot="suffix">€</span></mb-input></mb-field>
    <mb-field label="Small"><mb-input size="sm" placeholder="Search" type="search"></mb-input></mb-field>
  </div>
</div>

```html
<mb-field label="Price">
  <mb-input type="number" min="0"><span slot="suffix">€</span></mb-input>
</mb-field>
```

`type` is `text`, `email`, `password`, `search`, `tel`, `url`, or `number`.
Validity and messages are the native input's; `validators` run after them.
Without `mb-field`, name it with a `<label for>` or `aria-label`.

{% include "api.njk" %}
