---
layout: layout.njk
title: Listbox
api: [mb-listbox, mb-option]
---

# Listbox

```js
import 'match-box/components/define/listbox.js';
```

<div class="demo">
  <mb-listbox label="Fruit" color="primary">
    <mb-option>Apple</mb-option>
    <mb-option selected>Banana</mb-option>
    <mb-option disabled>Cherry</mb-option>
    <mb-option>Date</mb-option>
  </mb-listbox>
  <mb-listbox label="Toppings" multiple color="tertiary" size="sm">
    <mb-option value="nuts">Nuts</mb-option>
    <mb-option value="honey" selected>Honey</mb-option>
    <mb-option value="yogurt">Yogurt</mb-option>
  </mb-listbox>
</div>

```html
<form>
  <mb-listbox label="Toppings" name="toppings" multiple required>
    <mb-option value="nuts">Nuts</mb-option>
    <mb-option value="honey" selected>Honey</mb-option>
  </mb-listbox>
</form>
```

With `multiple`, the form gets one `toppings` entry per selected option.
An option's `value` defaults to its text.

{% include "api.njk" %}
