import { expect } from 'chai';
import { emulateMedia } from '@web/test-runner-commands';
import { exit, flip, reveal, stagger, type MotionTiming } from '../../../src/motion/index.ts';
import { resolveTiming } from '../../../src/motion/timing.ts';
import { loadTokens, setMotion } from '../../support/components.ts';
import { isPending, spyOnAnimate, tick, until } from '../../support/motion.ts';

const fade = [{ opacity: 0 }, { opacity: 1 }];

function boxes(count: number, parent: ParentNode = document.body): HTMLElement[] {
  const created = Array.from({ length: count }, (_, index) => {
    const element = document.createElement('div');
    element.style.height = '40px';
    element.textContent = String(index);
    return element;
  });
  parent.append(...created);
  return created;
}

/** Every helper's no-animation end state, with `animate()` never called. */
async function expectEndStatesWithoutAnimating(timing: MotionTiming = {}): Promise<void> {
  const spy = spyOnAnimate();
  try {
    const spacer = document.createElement('div');
    spacer.style.height = '300vh';
    document.body.append(spacer);
    const [below] = boxes(1);
    reveal(below, timing);
    expect(getComputedStyle(below).opacity).to.equal('1');

    expect(await isPending(stagger(boxes(2), fade, timing))).to.equal(false);

    const [first, second] = boxes(2);
    let changed = false;
    await flip([first, second], () => {
      changed = true;
      first.before(second);
    }, timing);
    expect(changed).to.equal(true);

    const [leaving] = boxes(1);
    await exit(leaving, timing);
    expect(leaving.isConnected).to.equal(false);

    expect(spy.count()).to.equal(0);
  } finally {
    spy.restore();
  }
}

describe('motion helpers', () => {
  before(async () => {
    await loadTokens();
  });

  beforeEach(() => {
    setMotion(true);
  });

  afterEach(async () => {
    document.body.replaceChildren();
    window.scrollTo(0, 0);
    await emulateMedia({ reducedMotion: 'no-preference' });
  });

  it('never animate under reduced motion', async () => {
    await emulateMedia({ reducedMotion: 'reduce' });
    await expectEndStatesWithoutAnimating();
    // Explicit durations bypass the tokens, which tokens.css already zeroes: only the media query stops these.
    await expectEndStatesWithoutAnimating({ duration: 200 });
  });

  it('never animate when the duration tokens are 0ms', async () => {
    setMotion(false);
    await expectEndStatesWithoutAnimating();
  });

  it('resolve every duration to 0 under reduced motion, numbers included', async () => {
    await emulateMedia({ reducedMotion: 'reduce' });
    const [element] = boxes(1);
    expect(resolveTiming(element, { duration: 500, delay: 100 }, { duration: 'medium', easing: 'standard' })).to.include({
      duration: 0,
      delay: 0,
    });
  });

  describe('inside a shadow root', () => {
    function shadow(): ShadowRoot {
      const host = document.createElement('div');
      document.body.append(host);
      return host.attachShadow({ mode: 'open' });
    }

    it('reveal plays for a target in view', async () => {
      const [target] = boxes(1, shadow());
      reveal(target);
      const [animation] = target.getAnimations();
      await until(() => animation.playState === 'running' || animation.playState === 'finished');
    });

    it('stagger, flip, and exit work on shadow children', async () => {
      const root = shadow();
      const [a, b] = boxes(2, root);
      void stagger([a, b], fade);
      expect(b.getAnimations()[0].effect!.getTiming().delay).to.equal(40);
      for (const animation of root.getAnimations()) animation.finish();

      void flip([a, b], () => a.before(b));
      await tick();
      expect(a.getAnimations()).to.have.length(1);
      for (const animation of root.getAnimations()) animation.finish();

      const done = exit(a);
      a.getAnimations()[0].finish();
      await done;
      expect(a.isConnected).to.equal(false);
    });
  });
});
