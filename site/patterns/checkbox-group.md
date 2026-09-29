---
layout: layout.njk
title: Checkbox group
---

# Checkbox group

A "select all" checkbox that is checked, unchecked, or mixed from the
items, and "at least one" validation, for native checkboxes.

## Layer 1: state

`CheckboxGroupState` holds the items (`key`, `checked`, `disabled`),
derives `parentState`, and has `setChecked`, `toggleAll`, and
`valueMissing`.

## Layer 2: DOM

```js
import { attachCheckboxGroup } from 'match-box/core';

attachCheckboxGroup({ root: fieldset, parent: selectAll, items: () => boxes }, { required: true });
```

<div class="demo" id="group-pattern"></div>
<script type="module">
  import { mountCheckboxGroup } from 'demos/demos.js';
  mountCheckboxGroup(document.getElementById('group-pattern'));
</script>

Conformance: `checkboxGroupConformance` in `match-box/core/testing`.
