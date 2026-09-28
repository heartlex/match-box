import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { exit, flip } from '../../src/motion/index.ts';
import { demoOf, fillList, fruit, motionArgTypes, motionArgs, styles, timing, type MotionArgs } from './shared.ts';

const meta: Meta<MotionArgs> = {
  title: 'Motion/Exit',
  args: motionArgs,
  argTypes: { ...motionArgTypes, interval: { table: { disable: true } } },
};
export default meta;

export const Exit: StoryObj<MotionArgs> = {
  render: (args) => {
    const remove = (event: Event): void => {
      const button = (event.target as Element).closest('[data-remove]');
      const item = button?.closest('li');
      if (!item) return;
      // exit() does not move focus: send it to a neighbor, or to Reset, before the item goes.
      const neighbor = item.nextElementSibling ?? item.previousElementSibling;
      const next = neighbor?.querySelector<HTMLElement>('[data-remove]') ?? demoOf(event).querySelector<HTMLElement>('[data-reset]');
      next?.focus();
      const siblings = [...item.parentElement!.children].filter((other) => other !== item);
      void flip(siblings, () => exit(item, timing(args)), timing(args));
    };
    const reset = (event: Event): void => {
      fillList(demoOf(event).querySelector('.motion-list')!, fruit, true);
    };
    return html`${styles}
      <div class="motion-demo">
        <div class="row"><mb-button data-reset @click=${reset}>Reset</mb-button></div>
        <ul
          class="motion-list"
          @click=${remove}
          ${ref((list) => {
            if (list) fillList(list, fruit, true);
          })}
        ></ul>
      </div>`;
  },
};
