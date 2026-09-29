---
layout: layout.njk
title: Checkbox group
api: [mb-checkbox-group]
---

# Checkbox group

```js
import 'match-box/components/define/checkbox-group.js';
```

<div class="demo">
  <mb-field label="Toppings" description="Pick at least one.">
    <mb-checkbox-group name="topping" required select-all color="primary">
      <mb-checkbox value="nuts">Nuts</mb-checkbox>
      <mb-checkbox value="honey" checked>Honey</mb-checkbox>
      <mb-checkbox value="yogurt" disabled>Yogurt</mb-checkbox>
      <mb-checkbox value="seeds">Seeds</mb-checkbox>
    </mb-checkbox-group>
  </mb-field>
</div>

```html
<mb-checkbox-group name="topping" required select-all>
  <mb-checkbox value="nuts">Nuts</mb-checkbox>
  <mb-checkbox value="honey">Honey</mb-checkbox>
</mb-checkbox-group>
```

The group submits one entry per checked child and validates "at least
one" with `required`. `select-all` adds a parent checkbox that checks or
unchecks every enabled child.

{% include "api.njk" %}
