import { expect } from 'chai';
import { reveal } from '../../../src/motion/index.ts';
import { loadTokens, setMotion } from '../../support/components.ts';
import { tick, until } from '../../support/motion.ts';

const styles = '<style>.box { height: 50px; } .spacer { height: 300vh; } .gone { display: none; }</style>';

/** Mounts `markup` after the styles; returns the elements with a `data-t` attribute, in order. */
function mount(markup: string): HTMLElement[] {
  const container = document.createElement('div');
  container.innerHTML = styles + markup;
  document.body.append(container);
  return [...container.querySelectorAll<HTMLElement>('[data-t]')];
}

const opacity = (element: Element): string => getComputedStyle(element).opacity;
const playing = (animation: Animation): boolean => animation.playState === 'running' || animation.playState === 'finished';

describe('reveal', () => {
  before(async () => {
    await loadTokens();
    setMotion(true);
  });

  afterEach(() => {
    document.body.replaceChildren();
    window.scrollTo(0, 0);
  });

  it('holds a target below the viewport at its first keyframe, with no inline style', () => {
    const [target] = mount('<div class="spacer"></div><div class="box" data-t></div>');
    reveal(target);
    const [animation] = target.getAnimations();
    expect(animation.playState).to.equal('paused');
    expect(opacity(target)).to.equal('0');
    expect(target.hasAttribute('style')).to.equal(false);
    expect(animation.effect!.getTiming()).to.include({ duration: 200, easing: 'cubic-bezier(0, 0, 0, 1)', fill: 'backwards' });
  });

  it('plays when the target enters the viewport', async () => {
    const [target] = mount('<div class="spacer"></div><div class="box" data-t></div>');
    reveal(target);
    const [animation] = target.getAnimations();
    target.scrollIntoView();
    await until(() => playing(animation));
    animation.finish();
    expect(opacity(target)).to.equal('1');
  });

  it('offsets targets that enter together by interval, in document order', async () => {
    const [a, b, c] = mount('<div class="box" data-t></div><div class="box" data-t></div><div class="box" data-t></div>');
    reveal([c, a, b], { interval: 10, delay: 5 });
    const animations = [a, b, c].map((target) => target.getAnimations()[0]);
    await until(() => animations.every(playing));
    expect(animations.map((animation) => animation.effect!.getTiming().delay)).to.deep.equal([5, 15, 25]);
  });

  it('shows a target above the viewport without animating', () => {
    const [target] = mount('<div class="box" data-t></div><div class="spacer"></div>');
    window.scrollTo(0, document.documentElement.scrollHeight);
    reveal(target);
    expect(target.getAnimations()).to.have.length(0);
    expect(opacity(target)).to.equal('1');
  });

  it('reveals a target at once when focus moves into it', () => {
    const [target] = mount('<div class="spacer"></div><div class="box" data-t><button>Go</button></div>');
    reveal(target);
    target.querySelector('button')!.focus({ preventScroll: true });
    expect(target.getAnimations()).to.have.length(0);
    expect(opacity(target)).to.equal('1');
  });

  it('stop() shows every waiting target and stops observing', async () => {
    const [target] = mount('<div class="spacer"></div><div class="box" data-t></div>');
    const stop = reveal(target);
    stop();
    expect(opacity(target)).to.equal('1');
    target.scrollIntoView();
    await tick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(target.getAnimations()).to.have.length(0);
  });

  it('shows waiting targets when aborted, and holds nothing when already aborted', () => {
    const [first, second] = mount('<div class="spacer"></div><div class="box" data-t></div><div class="box" data-t></div>');
    const controller = new AbortController();
    reveal(first, { signal: controller.signal });
    controller.abort();
    expect(opacity(first)).to.equal('1');
    reveal(second, { signal: AbortSignal.abort() });
    expect(second.getAnimations()).to.have.length(0);
  });

  it('lets a second reveal replace the first for a waiting target', async () => {
    const [target] = mount('<div class="spacer"></div><div class="box" data-t></div>');
    reveal(target);
    reveal(target, { keyframes: [{ opacity: 0.5 }, { opacity: 1 }] });
    expect(target.getAnimations()).to.have.length(1);
    expect(opacity(target)).to.equal('0.5');
    target.scrollIntoView();
    const [animation] = target.getAnimations();
    await until(() => playing(animation));
    expect(target.getAnimations()).to.have.length(1);
  });

  it('holds a target passed twice with one animation', () => {
    const [target] = mount('<div class="spacer"></div><div class="box" data-t></div>');
    reveal([target, target]);
    expect(target.getAnimations()).to.have.length(1);
  });

  it('reveals a target that was display: none, once it shows', async () => {
    const [target] = mount('<div class="box gone" data-t></div>');
    reveal(target);
    const [animation] = target.getAnimations();
    expect(animation.playState).to.equal('paused');
    target.classList.remove('gone');
    await until(() => playing(animation));
  });

  it('does nothing for no targets', () => {
    const stop = reveal([]);
    stop();
  });
});
