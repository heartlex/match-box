import { sendKeys, sendMouse } from '@web/test-runner-commands';
import type { Driver } from '../../src/core/testing/index.ts';

function center(element: Element): { x: number; y: number } {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

/** Real keyboard and mouse input through Playwright. */
export const driver: Driver = {
  async press(key) {
    await sendKeys({ press: key });
  },
  async click(target) {
    const point = target instanceof Element ? center(target) : target;
    await sendMouse({ type: 'click', position: [Math.round(point.x), Math.round(point.y)] });
  },
};
