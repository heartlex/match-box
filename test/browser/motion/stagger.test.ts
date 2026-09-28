import { expect } from 'chai';
import { stagger } from '../../../src/motion/index.ts';
import { loadTokens, setMotion } from '../../support/components.ts';
import { isPending } from '../../support/motion.ts';

const fade = [{ opacity: 0 }, { opacity: 1 }];

function boxes(count: number): HTMLElement[] {
  const created = Array.from({ length: count }, () => document.createElement('div'));
  document.body.append(...created);
  return created;
}

const timingOf = (element: Element): EffectTiming => element.getAnimations()[0].effect!.getTiming();

describe('stagger', () => {
  before(async () => {
    await loadTokens();
    setMotion(true);
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('delays each target by its index times interval, after delay', () => {
    const targets = boxes(3);
    void stagger(targets, fade);
    expect(targets.map((target) => timingOf(target).delay)).to.deep.equal([0, 40, 80]);
    const more = boxes(3);
    void stagger(more, fade, { interval: 10, delay: 5 });
    expect(more.map((target) => timingOf(target).delay)).to.deep.equal([5, 15, 25]);
  });

  it('uses the medium duration, the standard easing, and backwards fill', () => {
    const [target] = boxes(1);
    void stagger(target, fade);
    expect(timingOf(target)).to.include({ duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'backwards' });
  });

  it('holds later targets at their first keyframe until they start', () => {
    const targets = boxes(2);
    void stagger(targets, fade, { interval: 1000 });
    expect(getComputedStyle(targets[1]).opacity).to.equal('0');
  });

  it('resolves after the last animation finishes', async () => {
    const targets = boxes(2);
    const done = stagger(targets, fade);
    targets[0].getAnimations()[0].finish();
    expect(await isPending(done)).to.equal(true);
    targets[1].getAnimations()[0].finish();
    await done;
  });

  it('finishes every animation when aborted, and does nothing when already aborted', async () => {
    const targets = boxes(2);
    const controller = new AbortController();
    const done = stagger(targets, fade, { signal: controller.signal });
    controller.abort();
    await done;
    expect(targets.flatMap((target) => target.getAnimations())).to.have.length(0);
    expect(getComputedStyle(targets[1]).opacity).to.equal('1');
    const [late] = boxes(1);
    await stagger(late, fade, { signal: AbortSignal.abort() });
    expect(late.getAnimations()).to.have.length(0);
  });

  it('resolves at once for no targets', async () => {
    expect(await isPending(stagger([], fade))).to.equal(false);
  });
});
