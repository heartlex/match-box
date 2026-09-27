import { expect } from 'chai';
import { AttributeWriter } from '../../src/core/dom/index.ts';

describe('AttributeWriter', () => {
  it('writes attributes and removes the ones it no longer produces', () => {
    const element = document.createElement('div');
    const writer = new AttributeWriter();
    writer.write(element, { role: 'option', 'aria-selected': 'true' });
    expect(element.getAttribute('aria-selected')).to.equal('true');
    writer.write(element, { role: 'option', 'aria-selected': null });
    expect(element.hasAttribute('aria-selected')).to.equal(false);
    writer.write(element, {});
    expect(element.hasAttribute('role')).to.equal(false);
  });

  it('never touches attributes it did not write', () => {
    const element = document.createElement('div');
    element.setAttribute('class', 'template-owned');
    const writer = new AttributeWriter();
    writer.write(element, { role: 'listbox' });
    writer.releaseAll();
    expect(element.getAttribute('class')).to.equal('template-owned');
    expect(element.hasAttribute('role')).to.equal(false);
  });

  it('writes and clears element references', () => {
    const element = document.createElement('div');
    const label = document.createElement('span');
    // The getter only returns references to elements in a valid scope.
    document.body.append(element, label);
    const writer = new AttributeWriter();
    writer.writeReferences(element, { ariaLabelledByElements: [label] });
    expect(element.ariaLabelledByElements).to.deep.equal([label]);
    writer.writeReferences(element, {});
    expect(element.ariaLabelledByElements).to.equal(null);
    element.remove();
    label.remove();
  });

  it('retain releases elements that left the set', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    const writer = new AttributeWriter();
    writer.write(a, { tabindex: '0' });
    writer.write(b, { tabindex: '-1' });
    writer.retain([a]);
    expect(a.getAttribute('tabindex')).to.equal('0');
    expect(b.hasAttribute('tabindex')).to.equal(false);
  });
});
