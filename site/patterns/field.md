---
layout: layout.njk
title: Field
---

# Field

Label, description, and error for a native control, with the error shown
only after the user changed the control and left it, or a submit attempt.

```js
import { attachField } from 'match-box/core';

const field = attachField({ control, label, description, error });
field.setError('That address is taken.'); // until setError('')
```

<div class="demo" id="field-pattern"></div>
<script type="module">
  import { mountField } from 'demos/demos.js';
  mountField(document.getElementById('field-pattern'));
</script>

Conformance: `fieldConformance` in `match-box/core/testing`.
