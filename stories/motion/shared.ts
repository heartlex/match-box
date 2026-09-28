import { html } from 'lit';
import type { Meta } from '@storybook/web-components-vite';
import type { MotionTiming } from '../../src/motion/index.ts';

export interface MotionArgs {
  duration: 'fast' | 'medium' | 'slow' | number;
  easing: 'standard' | 'enter' | 'exit' | 'spring';
  interval: number;
}

export const motionArgs: MotionArgs = { duration: 'medium', easing: 'standard', interval: 40 };

export const motionArgTypes: NonNullable<Meta<MotionArgs>['argTypes']> = {
  duration: {
    control: 'select',
    options: ['fast', 'medium', 'slow', 1000],
    description: 'A duration token name, or milliseconds',
  },
  easing: {
    control: 'select',
    options: ['standard', 'enter', 'exit', 'spring'],
    description: 'An easing token name',
  },
  interval: { control: { type: 'range', min: 0, max: 200, step: 10 }, description: 'Milliseconds between elements' },
};

/** The args as helper options. */
export const timing = ({ duration, easing }: MotionArgs): MotionTiming => ({ duration, easing });

export const fadeUp: Keyframe[] = [
  { opacity: 0, transform: 'translateY(0.5rem)' },
  { opacity: 1, transform: 'none' },
];

export const fruit = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

export const styles = html`<style>
  .motion-demo { display: grid; gap: 0.75rem; max-inline-size: 22rem; }
  .motion-demo .row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .motion-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
  .motion-list li {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.5rem 0.75rem; border: 1px solid var(--mb-color-border-default);
    border-radius: var(--mb-radius-surface); background: var(--mb-color-bg-surface);
  }
</style>`;

/** The demo root around an event's target. */
export const demoOf = (event: Event): Element => (event.currentTarget as Element).closest('.motion-demo')!;

/**
 * Fills `list` with plain DOM items. Stories that move or remove items build them this way:
 * Lit's markers for a rendered list would break when the helpers reorder its children.
 */
export function fillList(list: Element, names: readonly string[], removable = false): void {
  list.replaceChildren(
    ...names.map((name) => {
      const item = document.createElement('li');
      item.append(name);
      if (removable) {
        const button = document.createElement('mb-button');
        button.setAttribute('size', 'sm');
        button.setAttribute('variant', 'ghost');
        button.dataset['remove'] = '';
        button.textContent = 'Remove';
        item.append(' ', button);
      }
      return item;
    }),
  );
}
