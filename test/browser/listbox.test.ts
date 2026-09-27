import { expect } from 'chai';
import { attachListbox } from '../../src/core/dom/index.ts';
import { listboxConformance } from '../../src/core/testing/index.ts';
import { mountPlainListbox } from '../skin/plain/listbox.ts';
import { expectNoAxeViolations } from '../support/axe.ts';
import { driver } from '../support/driver.ts';

listboxConformance({ name: 'plain', mount: mountPlainListbox, driver, audit: expectNoAxeViolations });

function options(labels: string[]): HTMLElement[] {
  return labels.map((label) => {
    const element = document.createElement('div');
    element.textContent = label;
    element.dataset['value'] = label.toLowerCase();
    return element;
  });
}

describe('attachListbox', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('attachListbox sync picks up added and removed options and cleans removed ones', () => {
    const root = document.createElement('div');
    let current = options(['Apple', 'Banana']);
    root.append(...current);
    document.body.append(root);
    const behavior = attachListbox({ root, items: () => current });
    const removed = current[0];
    current = options(['Banana', 'Cherry']);
    root.replaceChildren(...current);
    behavior.sync();
    expect(removed.getAttributeNames()).to.deep.equal(['data-value']);
    expect(current.map((element) => element.getAttribute('role'))).to.deep.equal(['option', 'option']);
    expect(behavior.state.items.map((item) => item.key)).to.deep.equal(['banana', 'cherry']);
  });

  it('attachListbox keeps the selection when options are re-rendered with the same keys', () => {
    const root = document.createElement('div');
    let current = options(['Apple', 'Banana']);
    root.append(...current);
    document.body.append(root);
    const behavior = attachListbox({ root, items: () => current });
    behavior.state.moveNext();
    behavior.state.selectActive();
    current = options(['Apple', 'Banana']);
    root.replaceChildren(...current);
    behavior.sync();
    expect(current[1]?.getAttribute('aria-selected')).to.equal('true');
    expect(current[1]?.getAttribute('tabindex')).to.equal('0');
  });

  it('attachListbox with no enabled options leaves nothing in the tab sequence', () => {
    const root = document.createElement('div');
    const current = options(['Apple']);
    current[0]?.setAttribute('data-disabled', '');
    root.append(...current);
    document.body.append(root);
    const behavior = attachListbox({ root, items: () => current });
    expect(behavior.state.activeIndex).to.equal(-1);
    expect(current[0]?.getAttribute('tabindex')).to.equal('-1');
  });

  it('keeps the selection on the same option when options without data-value are filtered', () => {
    const root = document.createElement('div');
    const plain = (labels: string[]): HTMLElement[] =>
      labels.map((label) => {
        const element = document.createElement('div');
        element.textContent = label;
        return element;
      });
    let current = plain(['Apple', 'Banana', 'Cherry']);
    root.append(...current);
    document.body.append(root);
    const behavior = attachListbox({ root, items: () => current });
    behavior.state.moveTo(1);
    behavior.state.selectActive();
    current = plain(['Banana', 'Cherry']);
    root.replaceChildren(...current);
    behavior.sync();
    expect(current.map((element) => element.getAttribute('aria-selected'))).to.deep.equal(['true', null]);
  });

  it('moves focus to the next option when the focused option is removed', () => {
    const root = document.createElement('div');
    let current = options(['Apple', 'Banana', 'Cherry']);
    root.append(...current);
    document.body.append(root);
    const behavior = attachListbox({ root, items: () => current });
    behavior.state.moveTo(1);
    current[1]?.focus();
    const [apple, banana, cherry] = current as [HTMLElement, HTMLElement, HTMLElement];
    banana.remove();
    current = [apple, cherry];
    behavior.sync();
    expect(behavior.state.activeItem?.key).to.equal('cherry');
    expect(document.activeElement).to.equal(cherry);
  });

  it('moves focus off an option that becomes disabled', () => {
    const root = document.createElement('div');
    const current = options(['Apple', 'Banana', 'Cherry']);
    root.append(...current);
    document.body.append(root);
    const behavior = attachListbox({ root, items: () => current });
    behavior.state.moveTo(1);
    current[1]?.focus();
    current[1]?.setAttribute('data-disabled', '');
    behavior.sync();
    expect(document.activeElement).to.equal(current[2]);
  });
});
