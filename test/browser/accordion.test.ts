import { expect } from 'chai';
import { attachAccordion } from '../../src/core/dom/index.ts';
import { DisclosureState } from '../../src/core/state/index.ts';
import { accordionConformance } from '../../src/core/testing/index.ts';
import { mountPlainAccordion } from '../skin/plain/accordion.ts';
import { expectNoAxeViolations } from '../support/axe.ts';
import { driver } from '../support/driver.ts';

accordionConformance({ name: 'plain', mount: mountPlainAccordion, driver, audit: expectNoAxeViolations });

const items = (count: number, expanded: boolean[] = []): { state: DisclosureState }[] =>
  Array.from({ length: count }, (_, index) => ({ state: new DisclosureState({ expanded: expanded[index] ?? false }) }));

describe('attachAccordion', () => {
  it('keeps only the first initially open item in single mode', () => {
    const list = items(3, [false, true, true]);
    attachAccordion({ items: () => list });
    expect(list.map((item) => item.state.expanded)).to.deep.equal([false, true, false]);
  });

  it('keeps every initially open item in multiple mode', () => {
    const list = items(3, [true, false, true]);
    attachAccordion({ items: () => list }, { multiple: true });
    expect(list.map((item) => item.state.expanded)).to.deep.equal([true, false, true]);
  });

  it('sync picks up added items and stops coordinating removed ones', () => {
    let list = items(2);
    const behavior = attachAccordion({ items: () => list });
    const removed = list[0];
    const added = items(1)[0];
    list = [list[1], added];
    behavior.sync();
    added.state.open();
    removed.state.open();
    list[0]?.state.open();
    expect([removed.state.expanded, list[0]?.state.expanded, added.state.expanded]).to.deep.equal([true, true, false]);
  });

  it('setMultiple(false) collapses all but the first open item', () => {
    const list = items(3);
    const behavior = attachAccordion({ items: () => list }, { multiple: true });
    list[2]?.state.open();
    list[1]?.state.open();
    behavior.state.setMultiple(false);
    expect(list.map((item) => item.state.expanded)).to.deep.equal([false, true, false]);
  });

  it('dispose stops coordination', () => {
    const list = items(2);
    const behavior = attachAccordion({ items: () => list });
    behavior.dispose();
    list[0]?.state.open();
    list[1]?.state.open();
    expect(list.map((item) => item.state.expanded)).to.deep.equal([true, true]);
  });
});
