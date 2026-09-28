---
layout: layout.njk
title: Motion
---

# Motion

`match-box/motion` animates your own pages with the same tokens as the
components. It has no dependencies and works in any framework.

```js
import { reveal, stagger, flip, exit } from 'match-box/motion';
```

<style>
  .motion-list { list-style: none; padding: 0; display: grid; gap: var(--mb-space-inline-sm); max-inline-size: 20rem; }
  .motion-list li { display: flex; align-items: center; justify-content: space-between; padding: var(--mb-space-stack-sm) var(--mb-space-inline-sm); border: 1px solid var(--mb-color-border-default); border-radius: var(--mb-radius-surface); background: var(--mb-color-bg-surface); }
  .reveal-card { padding: var(--mb-space-stack-md); border: 1px solid var(--mb-color-border-default); border-radius: var(--mb-radius-surface); }
</style>

<div class="demo">
  <div class="row">
    <mb-button id="motion-add" color="primary">Add</mb-button>
    <mb-button id="motion-shuffle">Shuffle</mb-button>
    <mb-button id="motion-stagger" variant="outline">Stagger</mb-button>
  </div>
  <ul class="motion-list" id="motion-list">
    <li>Apple <mb-button size="sm" variant="ghost" data-remove>Remove</mb-button></li>
    <li>Banana <mb-button size="sm" variant="ghost" data-remove>Remove</mb-button></li>
    <li>Cherry <mb-button size="sm" variant="ghost" data-remove>Remove</mb-button></li>
  </ul>
</div>
<script type="module">
  import { exit, flip, stagger } from 'match-box/motion';
  const list = document.getElementById('motion-list');
  const items = () => [...list.children];
  const fadeUp = [{ opacity: 0, transform: 'translateY(0.5rem)' }, { opacity: 1, transform: 'none' }];
  let count = 0;
  document.getElementById('motion-add').addEventListener('click', () => {
    count += 1;
    const item = document.createElement('li');
    item.innerHTML = `Item ${count} <mb-button size="sm" variant="ghost" data-remove>Remove</mb-button>`;
    flip(items(), () => list.prepend(item));
    stagger(item, fadeUp);
  });
  document.getElementById('motion-shuffle').addEventListener('click', () => {
    flip(items(), () => {
      for (const item of items().sort(() => Math.random() - 0.5)) list.append(item);
    });
  });
  document.getElementById('motion-stagger').addEventListener('click', () => stagger(items(), fadeUp));
  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    const item = button.closest('li');
    // exit() does not move focus: send it to a neighbor before the item goes.
    const neighbor = item.nextElementSibling ?? item.previousElementSibling;
    (neighbor?.querySelector('[data-remove]') ?? document.getElementById('motion-add')).focus();
    flip(items().filter((other) => other !== item), () => exit(item));
  });
</script>

## reveal

Animates elements the first time they enter the viewport. Until then they
show the first keyframe; nothing is written to `style`.

<div class="demo">
  <div class="reveal-card">First card</div>
  <div class="reveal-card">Second card</div>
  <div class="reveal-card">Third card</div>
</div>
<script type="module">
  import { reveal } from 'match-box/motion';
  reveal(document.querySelectorAll('.reveal-card'));
</script>

```js
const stop = reveal(document.querySelectorAll('.card'), { interval: 60 });
// Later: stop observing and show anything still waiting.
stop();
```

Elements already scrolled past show at once, and focus moving into a
waiting element reveals it.

## stagger

Plays one animation on a group, each element `interval` ms (default 40)
after the previous one. Resolves when the last one ends.

```js
await stagger(items, [{ opacity: 0 }, { opacity: 1 }], { interval: 60 });
```

## flip

Runs a DOM change, then animates elements from where they were to where
they are. Pass the elements that move, usually the siblings:

```js
await flip(list.children, () => list.prepend(item));
```

Size changes animate by scaling; `scale: false` animates position only.
A flip started while another runs picks up from where the element is.

## exit

Animates an element out, then removes it. While it exits it is `inert`.
Wrap it in `flip` so the siblings close the gap:

```js
await flip(siblings, () => exit(item));
```

`exit` does not move focus. If focus is inside the element, move it first,
as you would before `remove()`. `remove: false` keeps the element at its
last frame.

## Timing, cancellation, and reduced motion

Every helper takes `duration` (`'fast'`, `'medium'`, `'slow'`, or ms),
`easing` (`'standard'`, `'enter'`, `'exit'`, `'spring'`, or any CSS
easing), `delay`, and `signal`. Token names read the
[motion tokens](/theming/#motion) from the element, so a theme or a
subtree can retune them.

Aborting `signal` jumps to the end: revealed elements show, flips land,
exits remove. It never rejects.

Under `prefers-reduced-motion: reduce`, or when a duration is `0ms`,
nothing animates and each helper applies its end state at once.

See the [API reference](/api/) for every option.
