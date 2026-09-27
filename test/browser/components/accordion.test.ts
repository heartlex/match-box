import { expect } from 'chai';
import '../../../src/components/define/accordion.ts';
import type { MbAccordion, MbDisclosure } from '../../../src/components/index.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';

const item = (title: string, attributes = ''): string =>
  `<mb-disclosure ${attributes}><span slot="summary">${title}</span>${title} details.</mb-disclosure>`;

const disclosures = (accordion: MbAccordion): MbDisclosure[] => [...accordion.querySelectorAll('mb-disclosure')];

describe('mb-accordion', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('gives disclosures heading level 3 unless they set their own', async () => {
    const { element } = await mount<MbAccordion>(`<mb-accordion>${item('A')}${item('B', 'heading-level="4"')}</mb-accordion>`);
    const levels = disclosures(element).map((d) => part(d, 'heading').getAttribute('aria-level'));
    expect(levels).to.deep.equal(['3', '4']);
  });

  it('keeps only the first initially open disclosure in single mode', async () => {
    const { element } = await mount<MbAccordion>(`<mb-accordion>${item('A')}${item('B', 'open')}${item('C', 'open')}</mb-accordion>`);
    expect(disclosures(element).map((d) => d.open)).to.deep.equal([false, true, false]);
  });

  it('turning multiple off keeps the first open disclosure', async () => {
    const { element } = await mount<MbAccordion>(`<mb-accordion multiple>${item('A')}${item('B', 'open')}${item('C', 'open')}</mb-accordion>`);
    element.multiple = false;
    await settle(document.body);
    expect(disclosures(element).map((d) => d.open)).to.deep.equal([false, true, false]);
  });

  it('coordinates a disclosure added later', async () => {
    const { element } = await mount<MbAccordion>(`<mb-accordion>${item('A', 'open')}</mb-accordion>`);
    element.insertAdjacentHTML('beforeend', item('B'));
    await settle(document.body);
    const [first, second] = disclosures(element) as [MbDisclosure, MbDisclosure];
    second.open = true;
    await settle(document.body);
    expect([first.open, second.open]).to.deep.equal([false, true]);
  });

  it('keeps the same item open when moved after a user change', async () => {
    const { element } = await mount<MbAccordion>(`<mb-accordion>${item('A')}${item('B')}${item('C')}</mb-accordion>`);
    (disclosures(element)[2]).open = true;
    await settle(document.body);
    const other = document.createElement('div');
    document.body.append(other);
    other.append(element);
    await settle(document.body);
    expect(disclosures(element).map((d) => d.open)).to.deep.equal([false, false, true]);
  });
});
