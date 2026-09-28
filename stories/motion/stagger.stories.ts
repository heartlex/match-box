import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { stagger } from '../../src/motion/index.ts';
import { demoOf, fadeUp, fruit, motionArgTypes, motionArgs, styles, timing, type MotionArgs } from './shared.ts';

const meta: Meta<MotionArgs> = { title: 'Motion/Stagger', args: motionArgs, argTypes: motionArgTypes };
export default meta;

// A replay aborts the one before it, so repeated clicks never stack animations.
let controller: AbortController | undefined;

export const Stagger: StoryObj<MotionArgs> = {
  render: (args) => {
    const play = (event: Event): void => {
      controller?.abort();
      controller = new AbortController();
      const list = demoOf(event).querySelector('.motion-list')!;
      void stagger(list.children, fadeUp, { ...timing(args), interval: args.interval, signal: controller.signal });
    };
    return html`${styles}
      <div class="motion-demo">
        <div class="row"><mb-button color="primary" @click=${play}>Replay</mb-button></div>
        <ul class="motion-list">
          ${fruit.map((name) => html`<li>${name}</li>`)}
        </ul>
      </div>`;
  },
};
