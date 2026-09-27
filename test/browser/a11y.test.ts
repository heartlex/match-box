import { expect } from 'chai';
import { announce, deepActiveElement, saveFocus, tabbables, uniqueId } from '../../src/core/a11y/index.ts';

describe('core/a11y', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('uniqueId returns distinct prefixed ids', () => {
    const a = uniqueId();
    const b = uniqueId('field');
    expect(a).to.match(/^mb-\d+$/);
    expect(b).to.match(/^field-\d+$/);
    expect(a).not.to.equal(uniqueId());
  });

  it('deepActiveElement follows focus into shadow roots', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const input = document.createElement('input');
    host.attachShadow({ mode: 'open' }).append(input);
    input.focus();
    expect(document.activeElement).to.equal(host);
    expect(deepActiveElement()).to.equal(input);
  });

  it('saveFocus restores focus, and does nothing if the element is gone', () => {
    const a = document.createElement('button');
    const b = document.createElement('button');
    document.body.append(a, b);
    a.focus();
    const restore = saveFocus();
    b.focus();
    restore();
    expect(document.activeElement).to.equal(a);
    b.focus();
    a.remove();
    restore();
    expect(document.activeElement).to.equal(b);
  });

  it('tabbables finds focusable elements in order across shadow roots and slots', () => {
    document.body.innerHTML = `
      <button id="one">1</button>
      <div id="host"><button id="slotted" slot="s">slotted</button></div>
      <button id="disabled" disabled>x</button>
      <div hidden><button>hidden</button></div>
      <div inert><button>inert</button></div>
      <a>no href</a>
      <a id="link" href="#">link</a>
      <span id="minus" tabindex="-1">x</span>
      <span id="positive" tabindex="2">x</span>`;
    const host = document.getElementById('host') as HTMLElement;
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<input id="inner"><slot name="s"></slot>';
    const ids = tabbables(document).map((element) => element.id);
    expect(ids).to.deep.equal(['positive', 'one', 'inner', 'slotted', 'link']);
  });

  it('tabbables skips elements inert through a shadow ancestor', () => {
    const host = document.createElement('div');
    host.setAttribute('inert', '');
    document.body.append(host);
    host.attachShadow({ mode: 'open' }).innerHTML = '<button>inside</button>';
    expect(tabbables(document)).to.deep.equal([]);
  });

  it('announce writes into one shared polite live region', async () => {
    await announce('Saved');
    await announce('Deleted', 'assertive');
    const regions = document.querySelectorAll('[data-mb-live-region]');
    expect(regions).to.have.length(1);
    expect(regions[0]?.getAttribute('aria-live')).to.equal('assertive');
    expect(regions[0]?.textContent).to.equal('Deleted');
  });
});
