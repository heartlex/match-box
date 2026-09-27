import { expect } from 'chai';
import '../../../src/components/define/disclosure.ts';
import type { MbDisclosure } from '../../../src/components/index.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const markup = '<mb-disclosure><span slot="summary">Details</span>Content</mb-disclosure>';

describe('mb-disclosure', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('reflects open, sets :state(open), and fires toggle when the user opens it', async () => {
    const { element } = await mount<MbDisclosure>(markup);
    const events: string[] = [];
    element.addEventListener('toggle', (event) => events.push(`${event.oldState}>${event.newState}`));
    await driver.click(part(element, 'trigger'));
    await settle(document.body);
    expect(element.hasAttribute('open')).to.equal(true);
    expect(element.matches(':state(open)')).to.equal(true);
    expect(events).to.deep.equal(['closed>open']);
  });

  it('opens and closes from the open property, firing toggle once per change', async () => {
    const { element } = await mount<MbDisclosure>(markup);
    const events: string[] = [];
    element.addEventListener('toggle', (event) => events.push(event.newState));
    element.open = true;
    await settle(document.body);
    element.open = true;
    await settle(document.body);
    expect(part(element, 'panel').hidden).to.equal(false);
    element.open = false;
    await settle(document.body);
    expect(part(element, 'panel').hidden).to.equal(true);
    expect(events).to.deep.equal(['open', 'closed']);
  });

  it('starts open with the open attribute', async () => {
    const { element } = await mount<MbDisclosure>('<mb-disclosure open><span slot="summary">D</span>C</mb-disclosure>');
    expect(part(element, 'trigger').getAttribute('aria-expanded')).to.equal('true');
    expect(part(element, 'panel').checkVisibility()).to.equal(true);
  });

  it('heading-level wraps the trigger in a heading, and the controller follows the new trigger', async () => {
    const { element } = await mount<MbDisclosure>(markup);
    element.headingLevel = 2;
    await settle(document.body);
    const heading = part(element, 'heading');
    expect([heading.getAttribute('role'), heading.getAttribute('aria-level')]).to.deep.equal(['heading', '2']);
    await driver.click(part(element, 'trigger'));
    expect(part(element, 'trigger').getAttribute('aria-expanded')).to.equal('true');
  });
});
