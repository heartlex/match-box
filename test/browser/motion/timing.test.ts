import { expect } from 'chai';
import { resolveTiming, targetsOf } from '../../../src/motion/timing.ts';
import { loadTokens, setMotion } from '../../support/components.ts';

const fallback = { duration: 'medium', easing: 'standard' } as const;

function element(style = '', parent: Element = document.body): HTMLElement {
  const created = document.createElement('div');
  if (style) created.setAttribute('style', style);
  parent.append(created);
  return created;
}

describe('resolveTiming', () => {
  before(async () => {
    await loadTokens();
    setMotion(true);
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('resolves token names from the element', () => {
    expect(resolveTiming(element(), {}, fallback)).to.deep.equal({
      duration: 200,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      delay: 0,
    });
    expect(resolveTiming(element(), { duration: 'slow', easing: 'enter' }, fallback)).to.include({
      duration: 300,
      easing: 'cubic-bezier(0, 0, 0, 1)',
    });
    expect(resolveTiming(element(), { duration: 'fast', easing: 'exit' }, fallback)).to.include({
      duration: 120,
      easing: 'cubic-bezier(0.3, 0, 1, 1)',
    });
  });

  it('lets a subtree override a token', () => {
    const themed = element('--mb-motion-duration-medium: 50ms; --mb-motion-easing-standard: linear');
    expect(resolveTiming(element('', themed), {}, fallback)).to.include({ duration: 50, easing: 'linear' });
  });

  it('passes numbers through and clamps negatives to 0', () => {
    expect(resolveTiming(element(), { duration: 75, delay: 20 }, fallback)).to.include({ duration: 75, delay: 20 });
    expect(resolveTiming(element(), { duration: -1, delay: -5 }, fallback)).to.include({ duration: 0, delay: 0 });
  });

  it('uses the built-in defaults when a token is unset', () => {
    const bare = element('--mb-motion-duration-medium: initial; --mb-motion-easing-standard: initial');
    expect(resolveTiming(bare, {}, fallback)).to.include({ duration: 200, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
  });

  it('turns a token that is not a time into 0', () => {
    expect(resolveTiming(element('--mb-motion-duration-medium: fast'), {}, fallback).duration).to.equal(0);
  });

  it('turns an unknown duration name into 0', () => {
    const timing = { duration: 'huge' } as unknown as { duration: 'fast' };
    expect(resolveTiming(element(), timing, fallback).duration).to.equal(0);
  });

  it('passes a CSS easing through and replaces an unsupported one with ease-out', () => {
    expect(resolveTiming(element(), { easing: 'steps(4)' }, fallback).easing).to.equal('steps(4)');
    expect(resolveTiming(element(), { easing: 'bogus' }, fallback).easing).to.equal('ease-out');
  });
});

describe('targetsOf', () => {
  it('wraps an element and copies an iterable without duplicates', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    expect(targetsOf(a)).to.deep.equal([a]);
    expect(targetsOf([a, b, a])).to.deep.equal([a, b]);
    const parent = document.createElement('div');
    parent.append(a, b);
    const live = parent.children;
    const copied = targetsOf(live);
    parent.append(document.createElement('div'));
    expect(copied).to.deep.equal([a, b]);
  });
});
