---
layout: layout.njk
title: Accordion
api: [mb-accordion]
---

# Accordion

```js
import 'match-box/components/define/accordion.js';
```

<div class="demo">
  <mb-accordion>
    <mb-disclosure><span slot="summary">Shipping</span>Orders ship within two business days.</mb-disclosure>
    <mb-disclosure><span slot="summary">Returns</span>Return any item within 30 days.</mb-disclosure>
    <mb-disclosure><span slot="summary">Warranty</span>Two years on all hardware.</mb-disclosure>
  </mb-accordion>
</div>

```html
<mb-accordion multiple heading-level="2">
  <mb-disclosure><span slot="summary">Shipping</span>…</mb-disclosure>
  <mb-disclosure><span slot="summary">Returns</span>…</mb-disclosure>
</mb-accordion>
```

Opening one disclosure closes the others unless `multiple` is set. Each
trigger sits in a heading, level 3 by default.

{% include "api.njk" %}
