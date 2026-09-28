import { html } from 'lit';
import { ref } from 'lit/directives/ref.js';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { reveal } from '../../src/motion/index.ts';
import { demoOf, motionArgTypes, motionArgs, styles, timing, type MotionArgs } from './shared.ts';

const meta: Meta<MotionArgs> = {
  title: 'Motion/Reveal',
  args: { ...motionArgs, easing: 'enter' },
  argTypes: motionArgTypes,
};
export default meta;

let stop: (() => void) | undefined;

export const Reveal: StoryObj<MotionArgs> = {
  render: (args) => {
    const start = (demo: Element): void => {
      stop?.();
      stop = reveal(demo.querySelectorAll('.reveal-card'), { ...timing(args), interval: args.interval });
    };
    const replay = (event: Event): void => {
      const demo = demoOf(event);
      for (const card of demo.querySelectorAll('.reveal-card')) for (const animation of card.getAnimations()) animation.cancel();
      window.scrollTo(0, 0);
      start(demo);
    };
    return html`${styles}
      <div
        class="motion-demo"
        ${ref((demo) => {
          // Lit calls this before it renders the cards inside the demo; start once they exist.
          if (demo) queueMicrotask(() => start(demo));
        })}
      >
        <div class="row"><mb-button color="primary" @click=${replay}>Replay</mb-button></div>
        <p>Scroll down: each card fades up the first time it enters the view.</p>
        <ul class="motion-list">
          ${Array.from({ length: 12 }, (_, index) => html`<li class="reveal-card" style="min-block-size: 6rem">Card ${index + 1}</li>`)}
        </ul>
      </div>`;
  },
};
