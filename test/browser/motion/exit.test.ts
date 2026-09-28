import { expect } from 'chai';
import '../../../src/components/define/listbox.ts';
import type { MbListbox, MbOption } from '../../../src/components/index.ts';
import { exit } from '../../../src/motion/index.ts';
import { loadTokens, mount, setMotion, settle } from '../../support/components.ts';

function box(): HTMLElement {
  const created = document.createElement('div');
  created.textContent = 'Item';
  document.body.append(created);
  return created;
}

const animationOf = (element: Element): Animation => element.getAnimations()[0];

describe('exit', () => {
  before(async () => {
    await loadTokens();
    setMotion(true);
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('makes the target inert, animates it out, then removes it', async () => {
    const target = box();
    const done = exit(target);
    expect(target.hasAttribute('inert')).to.equal(true);
    expect(target.isConnected).to.equal(true);
    expect(animationOf(target).effect!.getTiming()).to.include({
      duration: 120,
      easing: 'cubic-bezier(0.3, 0, 1, 1)',
      fill: 'forwards',
    });
    animationOf(target).finish();
    await done;
    expect(target.isConnected).to.equal(false);
  });

  it('keeps the target at its last frame with remove: false', async () => {
    const target = box();
    const done = exit(target, { remove: false });
    animationOf(target).finish();
    await done;
    expect(target.isConnected).to.equal(true);
    expect(target.hasAttribute('inert')).to.equal(true);
    expect(getComputedStyle(target).opacity).to.equal('0');
  });

  it('returns the same promise to a second call', () => {
    const target = box();
    expect(exit(target)).to.equal(exit(target));
  });

  it('removes the target at once when aborted or already aborted', async () => {
    const target = box();
    const controller = new AbortController();
    const done = exit(target, { signal: controller.signal });
    controller.abort();
    await done;
    expect(target.isConnected).to.equal(false);
    const other = box();
    await exit(other, { signal: AbortSignal.abort() });
    expect(other.isConnected).to.equal(false);
  });

  it('an exited element put back is visible and interactive', async () => {
    const target = box();
    const done = exit(target);
    animationOf(target).finish();
    await done;
    document.body.append(target);
    expect(target.hasAttribute('inert')).to.equal(false);
    expect(target.getAnimations()).to.have.length(0);
    expect(getComputedStyle(target).opacity).to.equal('1');
  });

  it('keeps inert on a target that already had it', async () => {
    const target = box();
    target.setAttribute('inert', '');
    const done = exit(target);
    animationOf(target).finish();
    await done;
    expect(target.hasAttribute('inert')).to.equal(true);
  });

  it('resolves for an element that is not connected', async () => {
    await exit(document.createElement('div'));
  });

  it('leaves a listbox as a synchronous remove() does when its selected option exits', async () => {
    const { element: listbox } = await mount<MbListbox>(
      '<mb-listbox label="Fruit"><mb-option>Apple</mb-option><mb-option value="b">Banana</mb-option><mb-option>Cherry</mb-option></mb-listbox>',
    );
    listbox.value = 'b';
    await settle(document.body);
    const banana = listbox.querySelector<MbOption>('mb-option[value="b"]')!;
    const done = exit(banana);
    animationOf(banana).finish();
    await done;
    await settle(document.body);
    expect(banana.isConnected).to.equal(false);
    expect([listbox.value, listbox.values]).to.deep.equal(['', []]);
    expect([...listbox.querySelectorAll('mb-option')].map((option) => option.textContent)).to.deep.equal([
      'Apple',
      'Cherry',
    ]);
  });
});
