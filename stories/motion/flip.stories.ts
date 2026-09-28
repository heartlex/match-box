import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { flip, stagger } from '../../src/motion/index.ts';
import { demoOf, fadeUp, fillList, fruit, motionArgTypes, motionArgs, styles, timing, type MotionArgs } from './shared.ts';

const meta: Meta<MotionArgs> = {
  title: 'Motion/Flip',
  args: motionArgs,
  argTypes: { ...motionArgTypes, interval: { table: { disable: true } } },
};
export default meta;

let added = 0;

export const Flip: StoryObj<MotionArgs> = {
  render: (args) => {
    const listOf = (event: Event): Element => demoOf(event).querySelector('.motion-list')!;
    const shuffle = (event: Event): void => {
      const list = listOf(event);
      const items = [...list.children];
      void flip(
        items,
        () => {
          for (const item of [...items].sort(() => Math.random() - 0.5)) list.append(item);
        },
        timing(args),
      );
    };
    const add = (event: Event): void => {
      const list = listOf(event);
      const item = document.createElement('li');
      item.textContent = `Item ${(added += 1)}`;
      void flip([...list.children], () => list.prepend(item), timing(args));
      void stagger(item, fadeUp, timing(args));
    };
    return html`${styles}
      <div class="motion-demo">
        <div class="row">
          <mb-button color="primary" @click=${add}>Add</mb-button>
          <mb-button @click=${shuffle}>Shuffle</mb-button>
        </div>
        <ul
          class="motion-list"
          ${ref((list) => {
            if (list) fillList(list, fruit);
          })}
        ></ul>
      </div>`;
  },
};
