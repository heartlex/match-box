---
layout: layout.njk
title: Disclosure
api: [mb-disclosure]
---

# Disclosure

```js
import 'match-box/components/define/disclosure.js';
```

<div class="demo">
  <mb-disclosure>
    <span slot="summary">Shipping details</span>
    Orders ship within two business days.
  </mb-disclosure>
  <mb-disclosure color="primary" open>
    <span slot="summary">Returns</span>
    Return any item within 30 days.
  </mb-disclosure>
  <mb-disclosure size="sm">
    <span slot="summary">Small</span>
    A small disclosure.
  </mb-disclosure>
</div>

```html
<mb-disclosure open>
  <span slot="summary">Shipping details</span>
  Orders ship within two business days.
</mb-disclosure>
```

{% include "api.njk" %}
