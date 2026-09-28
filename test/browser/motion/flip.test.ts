import { expect } from 'chai';
import { flip } from '../../../src/motion/index.ts';
import { loadTokens, setMotion } from '../../support/components.ts';
import { tick } from '../../support/motion.ts';

function mountList(): { list: HTMLElement; items: HTMLElement[] } {
  const container = document.createElement('div');
  container.innerHTML = `<style>.list { display: flex; flex-direction: column; width: 200px; } .item { height: 40px; }</style>
    <div class="list"><div class="item">A</div><div class="item">B</div><div class="item">C</div></div>`;
  document.body.append(container);
  const list = container.querySelector<HTMLElement>('.list')!;
  return { list, items: [...list.children] as HTMLElement[] };
}

function item(): HTMLElement {
  const created = document.createElement('div');
  created.className = 'item';
  return created;
}

/** Pauses the element's flip animation at `time` and returns its rect there. */
function rectAt(element: Element, time: number): DOMRect {
  const [animation] = element.getAnimations();
  animation.pause();
  animation.currentTime = time;
  return element.getBoundingClientRect();
}

describe('flip', () => {
  before(async () => {
    await loadTokens();
    setMotion(true);
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('starts each target where it was and ends where it is', async () => {
    const { list, items } = mountList();
    const before = items.map((target) => target.getBoundingClientRect().top);
    const added = item();
    const done = flip(list.children, () => list.prepend(added));
    await tick();
    expect(added.getAnimations()).to.have.length(0);
    items.forEach((target, index) => expect(rectAt(target, 0).top).to.be.closeTo(before[index], 0.5));
    for (const target of items) target.getAnimations()[0].finish();
    await done;
    items.forEach((target, index) => expect(target.getBoundingClientRect().top).to.be.closeTo(before[index] + 40, 0.5));
  });

  it('uses the medium duration and the standard easing', async () => {
    const { list, items } = mountList();
    void flip(items, () => list.prepend(item()));
    await tick();
    expect(items[0].getAnimations()[0].effect!.getTiming()).to.include({
      duration: 200,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
    });
  });

  it('scales a target that changes size, and only translates with scale: false', async () => {
    const { list, items } = mountList();
    void flip(items[0], () => {
      list.style.width = '400px';
    });
    await tick();
    expect(rectAt(items[0], 0).width).to.be.closeTo(200, 0.5);
    list.style.width = '200px';
    items[0].getAnimations()[0].cancel();
    void flip(items[0], () => {
      list.style.width = '400px';
    }, { scale: false });
    await tick();
    expect(items[0].getAnimations()).to.have.length(0);
  });

  it('skips targets that the change removes', async () => {
    const { items } = mountList();
    const done = flip(items, () => items[0].remove());
    await tick();
    expect(items[0].getAnimations()).to.have.length(0);
    expect(items[1].getAnimations()).to.have.length(1);
    for (const target of items) for (const animation of target.getAnimations()) animation.finish();
    await done;
  });

  it('animates a target that the change moves out and back in', async () => {
    const { list, items } = mountList();
    const top = items[0].getBoundingClientRect().top;
    void flip(items, () => list.append(items[0]));
    await tick();
    expect(rectAt(items[0], 0).top).to.be.closeTo(top, 0.5);
  });

  it('starts an interrupted flip from where the target is', async () => {
    const { list, items } = mountList();
    void flip(items, () => list.prepend(item()));
    await tick();
    const first = items[0].getAnimations()[0];
    const middle = rectAt(items[0], 100).top;
    void flip(items, () => list.prepend(item()));
    await tick();
    expect(first.playState).to.equal('idle');
    expect(items[0].getAnimations()).to.have.length(1);
    expect(rectAt(items[0], 0).top).to.be.closeTo(middle, 0.5);
  });

  it('awaits an async change', async () => {
    const { list, items } = mountList();
    const done = flip(items, async () => {
      await tick();
      list.prepend(item());
    });
    await tick();
    await tick();
    expect(items[0].getAnimations()).to.have.length(1);
    items.forEach((target) => target.getAnimations()[0].finish());
    await done;
  });

  it('rejects with the error a change throws', async () => {
    const { items } = mountList();
    const error = new Error('boom');
    let caught: unknown;
    try {
      await flip(items, () => {
        throw error;
      });
    } catch (thrown) {
      caught = thrown;
    }
    expect(caught).to.equal(error);
  });

  it('ends at the new layout when aborted', async () => {
    const { list, items } = mountList();
    const before = items[0].getBoundingClientRect().top;
    const controller = new AbortController();
    const done = flip(items, () => list.prepend(item()), { signal: controller.signal });
    await tick();
    controller.abort();
    await done;
    expect(items[0].getAnimations()).to.have.length(0);
    expect(items[0].getBoundingClientRect().top).to.be.closeTo(before + 40, 0.5);
  });
});
