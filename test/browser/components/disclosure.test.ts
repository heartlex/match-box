import { expect } from 'chai';
import { emulateMedia } from '@web/test-runner-commands';
import '../../../src/components/define/disclosure.ts';
import type { MbDisclosure } from '../../../src/components/index.ts';
import { loadTokens, mount, part, resolveLength, setMotion, settle } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const markup = '<mb-disclosure><span slot="summary">Details</span>Content</mb-disclosure>';

const shown = (element: MbDisclosure): boolean => part(element, 'panel').checkVisibility({ visibilityProperty: true });

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
    expect(shown(element)).to.equal(true);
    element.open = false;
    await settle(document.body);
    expect(shown(element)).to.equal(false);
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

  it("a closed panel's content cannot be focused", async () => {
    const { element } = await mount<MbDisclosure>(
      '<mb-disclosure><span slot="summary">Details</span><a href="#inside">Inside</a></mb-disclosure>',
    );
    const link = element.querySelector('a') as HTMLAnchorElement;
    expect(link.checkVisibility({ visibilityProperty: true })).to.equal(false);
    link.focus();
    expect(document.activeElement === link, 'focused').to.equal(false);
  });

  it('size sets trigger height (one step taller than the control), font size, and gap from the scale, with fixed padding', async () => {
    const { container } = await mount(
      ['sm', 'md', 'lg'].map((size) => `<mb-disclosure size="${size}" open><span slot="summary">S</span>Body</mb-disclosure>`).join(''),
    );
    const disclosures = [...container.querySelectorAll('mb-disclosure')];
    ['sm', 'md', 'lg'].forEach((size, index) => {
      const trigger = getComputedStyle(part(disclosures[index] as Element, 'trigger'));
      const height = Number.parseFloat(resolveLength(`--mb-size-${size}-height`)) + Number.parseFloat(resolveLength('--mb-space-2'));
      expect(trigger.minBlockSize, `${size} height`).to.equal(`${height}px`);
      expect(trigger.paddingInlineStart, `${size} padding`).to.equal(resolveLength('--mb-space-4'));
      expect(trigger.fontSize, `${size} font size`).to.equal(resolveLength(`--mb-size-${size}-font-size`));
      expect(trigger.columnGap, `${size} gap`).to.equal(resolveLength(`--mb-size-${size}-gap`));
    });
    const md = disclosures[1] as Element;
    expect(part(md, 'trigger').getBoundingClientRect().height).to.equal(48);
    const content = part(md, 'panel').querySelector('.content') as HTMLElement;
    expect(getComputedStyle(content).paddingInlineStart).to.equal(resolveLength('--mb-space-4'));
  });

  it('has 48px medium-weight trigger rows at md, one step taller than the control height', async () => {
    const { container } = await mount(
      '<mb-disclosure size="sm"><span slot="summary">A</span>x</mb-disclosure><mb-disclosure><span slot="summary">B</span>y</mb-disclosure>',
    );
    const [sm, md] = [...container.querySelectorAll('mb-disclosure')].map((element) => part(element, 'trigger'));
    expect(md?.getBoundingClientRect().height).to.equal(48);
    expect(sm?.getBoundingClientRect().height).to.equal(40);
    expect(getComputedStyle(md).fontWeight).to.equal('500');
    expect(getComputedStyle(md).paddingInlineStart).to.equal('16px');
  });

  it('a component token beats the size scale', async () => {
    const { element } = await mount<MbDisclosure>(
      `<mb-disclosure size="sm" style="--mb-disclosure-height: 60px">${markup.slice('<mb-disclosure>'.length)}`,
    );
    expect(getComputedStyle(part(element, 'trigger')).minBlockSize).to.equal('60px');
  });

  describe('motion', () => {
    before(() => setMotion(true));
    after(() => setMotion(false));
    afterEach(() => emulateMedia({ reducedMotion: 'no-preference' }));

    it('animates the panel rows, visibility, and chevron with --mb-disclosure-duration', async () => {
      const { element } = await mount<MbDisclosure>(
        `<mb-disclosure style="--mb-disclosure-duration: 123ms">${markup.slice('<mb-disclosure>'.length)}`,
      );
      const panel = getComputedStyle(part(element, 'panel'));
      expect(panel.transitionProperty).to.equal('grid-template-rows, visibility');
      expect(panel.transitionDuration).to.equal('0.123s');
      expect(getComputedStyle(part(element, 'icon')).transitionDuration).to.equal('0.123s');
    });

    it('is still hidden from the tab order once closed', async () => {
      const { element } = await mount<MbDisclosure>(markup);
      element.open = true;
      await settle(document.body);
      element.open = false;
      await new Promise((resolve) => setTimeout(resolve, 350));
      expect(shown(element)).to.equal(false);
    });

    it('has no panel transition duration under reduced motion', async () => {
      await emulateMedia({ reducedMotion: 'reduce' });
      const { element } = await mount<MbDisclosure>(markup);
      expect(getComputedStyle(part(element, 'panel')).transitionDuration).to.equal('0s');
    });
  });
});
