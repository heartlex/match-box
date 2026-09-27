---
layout: layout.njk
title: Button
api: [mb-button]
---

# Button

```js
import 'match-box/components/define/button.js';
```

<div class="demo">
  <div class="row">
    <mb-button>Neutral</mb-button>
    <mb-button color="primary">Primary</mb-button>
    <mb-button color="secondary">Secondary</mb-button>
    <mb-button color="tertiary">Tertiary</mb-button>
    <mb-button color="danger">Danger</mb-button>
  </div>
  <div class="row">
    <mb-button variant="outline">Neutral</mb-button>
    <mb-button variant="outline" color="primary">Primary</mb-button>
    <mb-button variant="outline" color="secondary">Secondary</mb-button>
    <mb-button variant="outline" color="tertiary">Tertiary</mb-button>
    <mb-button variant="outline" color="danger">Danger</mb-button>
  </div>
  <div class="row">
    <mb-button variant="ghost">Neutral</mb-button>
    <mb-button variant="ghost" color="primary">Primary</mb-button>
    <mb-button variant="ghost" color="secondary">Secondary</mb-button>
    <mb-button variant="ghost" color="tertiary">Tertiary</mb-button>
    <mb-button variant="ghost" color="danger">Danger</mb-button>
  </div>
  <div class="row"><mb-button disabled>Disabled</mb-button></div>
</div>

```html
<mb-button variant="outline" color="primary">Save</mb-button>
<form>
  <mb-button type="submit" color="primary">Send</mb-button>
  <mb-button type="reset" variant="ghost">Reset</mb-button>
</form>
```

`variant` sets the structure and `color` the color role; any pair works.

{% include "api.njk" %}
