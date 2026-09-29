---
layout: layout.njk
title: Switch
api: [mb-switch]
---

# Switch

```js
import 'match-box/components/define/switch.js';
```

<div class="demo">
  <div style="display: grid; gap: 0.5rem;">
    <mb-switch color="primary" checked>Wi-Fi</mb-switch>
    <mb-switch>Bluetooth</mb-switch>
    <mb-switch size="sm" disabled>Airplane mode</mb-switch>
  </div>
</div>

```html
<mb-switch name="notify">Email me about updates</mb-switch>
```

A checkbox with `role="switch"`, drawn as a track and thumb. It submits
like a checkbox.

{% include "api.njk" %}
