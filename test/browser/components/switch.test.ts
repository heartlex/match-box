import { expect } from 'chai';
import { sendKeys } from '@web/test-runner-commands';
import '../../../src/components/define/all.ts';
import type { MbSwitch } from '../../../src/components/index.ts';
import { nameOf } from '../../../src/core/testing/names.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part, resolveColor, settle } from '../../support/components.ts';

const inner = (element: Element): HTMLInputElement =>
  element.shadowRoot?.querySelector('input') as HTMLInputElement;

const px = (value: string): number => parseFloat(value);

describe('mb-switch', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('is a named switch that toggles with Space', async () => {
    const { element: form } = await mount<HTMLFormElement>('<form><mb-switch name="mail">Email me</mb-switch></form>');
    const toggle = form.querySelector('mb-switch') as MbSwitch;
    expect(inner(toggle).getAttribute('role')).to.equal('switch');
    expect(nameOf(inner(toggle))).to.equal('Email me');
    toggle.focus();
    await sendKeys({ press: 'Space' });
    await settle(document.body);
    expect([toggle.checked, inner(toggle).checked]).to.deep.equal([true, true]);
    expect(new FormData(form).get('mail')).to.equal('on');
    await expectNoAxeViolations(form);
  });

  it('resets to the checked attribute', async () => {
    const { element: form } = await mount<HTMLFormElement>('<form><mb-switch checked>Wi-Fi</mb-switch></form>');
    const toggle = form.querySelector('mb-switch') as MbSwitch;
    toggle.checked = false;
    await settle(document.body);
    form.reset();
    await settle(document.body);
    expect(toggle.checked).to.equal(true);
  });

  it('has a 36×20 track at md, 32×18 at sm, and 44×24 at lg', async () => {
    const { container } = await mount('<mb-switch size="sm">A</mb-switch><mb-switch>B</mb-switch><mb-switch size="lg">C</mb-switch>');
    const tracks = [...container.querySelectorAll('mb-switch')].map((toggle) => part(toggle, 'track').getBoundingClientRect());
    expect(tracks.map((track) => [track.width, track.height])).to.deep.equal([
      [32, 18],
      [36, 20],
      [44, 24],
    ]);
  });

  it('thumb has non-zero width', async () => {
    const { element: container } = await mount<HTMLElement>('<mb-switch>Label</mb-switch>');
    const toggle = container as unknown as MbSwitch;
    const thumb = part(toggle, 'thumb');
    const thumbWidth = px(getComputedStyle(thumb).width);
    expect(thumbWidth).to.be.greaterThan(0);
  });

  it('toggling on moves the thumb right by track width minus thumb minus 6px', async () => {
    const { element: container } = await mount<HTMLElement>('<mb-switch>Label</mb-switch>');
    const toggle = container as unknown as MbSwitch;
    const track = part(toggle, 'track');
    const thumb = part(toggle, 'thumb');

    const trackWidth = px(getComputedStyle(track).width);
    const thumbWidth = px(getComputedStyle(thumb).width);

    const thumbLeftBefore = thumb.getBoundingClientRect().left;
    toggle.checked = true;
    await settle(document.body);
    const thumbLeftAfter = thumb.getBoundingClientRect().left;

    const expectedMove = trackWidth - thumbWidth - 6; // 3px inset (1.5px border + 1.5px padding) on each side
    expect(thumbLeftAfter - thumbLeftBefore).to.approximately(expectedMove, 1);
  });

  it('with dir="rtl", toggling on moves the thumb left', async () => {
    const { element: wrapper } = await mount<HTMLElement>('<div dir="rtl"><mb-switch>Label</mb-switch></div>');
    const toggle = wrapper.querySelector('mb-switch') as MbSwitch;
    const thumb = part(toggle, 'thumb');

    const thumbLeftBefore = thumb.getBoundingClientRect().left;
    toggle.checked = true;
    await settle(document.body);
    const thumbLeftAfter = thumb.getBoundingClientRect().left;

    expect(thumbLeftAfter).to.be.lessThan(thumbLeftBefore);
  });

  for (const size of ['sm', 'md', 'lg']) {
    it(`moves the thumb the same distance in RTL at ${size}`, async () => {
      const { container } = await mount(`<mb-switch size="${size}">A</mb-switch><div dir="rtl"><mb-switch size="${size}">B</mb-switch></div>`);
      const [ltr, rtl] = [...container.querySelectorAll('mb-switch')] as [MbSwitch, MbSwitch];
      const before = [ltr, rtl].map((toggle) => part(toggle, 'thumb').getBoundingClientRect().left);
      ltr.checked = true;
      rtl.checked = true;
      await settle(document.body);
      const after = [ltr, rtl].map((toggle) => part(toggle, 'thumb').getBoundingClientRect().left);
      expect((after[0] ?? 0) - (before[0] ?? 0)).to.be.greaterThan(0);
      expect((after[0] ?? 0) - (before[0] ?? 0)).to.approximately((before[1] ?? 0) - (after[1] ?? 0), 0.5);
    });
  }

  it('shows a border-strong thumb when off and an on-solid thumb on primary when on', async () => {
    const { element } = await mount<MbSwitch>('<mb-switch>A</mb-switch>');
    const thumb = part(element, 'thumb');
    expect(getComputedStyle(thumb).backgroundColor).to.equal(resolveColor('--mb-color-border-strong'));
    element.checked = true;
    await settle(document.body);
    expect(getComputedStyle(thumb).backgroundColor).to.equal(resolveColor('--mb-color-primary-on-solid'));
    expect(getComputedStyle(part(element, 'track')).backgroundColor).to.equal(resolveColor('--mb-color-primary-solid'));
  });

  it('--mb-switch-track-width on ancestor overrides track width', async () => {
    const { element: wrapper } = await mount<HTMLElement>('<div style="--mb-switch-track-width: 60px;"><mb-switch>Label</mb-switch></div>');
    const toggle = wrapper.querySelector('mb-switch') as MbSwitch;
    const track = part(toggle, 'track');
    const trackWidth = px(getComputedStyle(track).width);
    expect(trackWidth).to.approximately(60, 1);
  });

  it('shows visual styling for user-invalid state', async () => {
    const { element: form } = await mount<HTMLFormElement>(
      '<form><mb-switch name="consent" required>I agree</mb-switch><button>Submit</button></form>'
    );
    const toggle = form.querySelector('mb-switch') as MbSwitch;
    const track = part(toggle, 'track');

    toggle.focus();
    await sendKeys({ press: 'Space' });
    await settle(document.body);
    await sendKeys({ press: 'Space' });
    await settle(document.body);
    await sendKeys({ press: 'Tab' });
    await settle(document.body);

    const boxShadow = getComputedStyle(track).boxShadow;
    const dangerColor = resolveColor('--mb-color-danger-border', form);

    expect(boxShadow).to.include(dangerColor);
  });
});
