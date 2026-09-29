---
layout: layout.njk
title: Checkbox
api: [mb-checkbox]
---

# Checkbox

```js
import 'match-box/components/define/checkbox.js';
```

<div class="demo">
  <div style="display: grid; gap: 0.5rem;">
    <mb-checkbox>Unchecked</mb-checkbox>
    <mb-checkbox checked color="primary">Checked</mb-checkbox>
    <mb-checkbox indeterminate color="primary">Indeterminate</mb-checkbox>
    <mb-checkbox disabled>Disabled</mb-checkbox>
  </div>
</div>

```html
<mb-checkbox name="terms" required>I accept the terms</mb-checkbox>
```

It submits `name=value` (`value` is `on` by default) when checked. The
`checked` attribute is the reset state; `indeterminate` shows a dash and
clears when the user toggles.

{% include "api.njk" %}
