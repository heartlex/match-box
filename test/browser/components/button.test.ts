import { expect } from 'chai';
import { emulateMedia, sendKeys, sendMouse } from '@web/test-runner-commands';
import '../../../src/components/define/button.ts';
import type { MbButton } from '../../../src/components/index.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part, resolveColor, resolveLength, setMotion, settle } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

async function formWith(markup: string): Promise<{ form: HTMLFormElement; button: MbButton; submits: number[] }> {
  const { element: form } = await mount<HTMLFormElement>(`<form><input name="city" value="Oslo">${markup}</form>`);
  const submits: number[] = [];
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submits.push(1);
  });
  return { form, button: form.querySelector('mb-button') as MbButton, submits };
}

describe('mb-button', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders a native button with the label, hiding empty prefix and suffix', async () => {
    const { element } = await mount<MbButton>('<mb-button>Save</mb-button>');
    expect(part(element, 'base').localName).to.equal('button');
    expect(part(element, 'prefix').hidden).to.equal(true);
    expect(part(element, 'suffix').hidden).to.equal(true);
  });

  it('shows the prefix wrapper when something is slotted into it', async () => {
    const { element } = await mount<MbButton>('<mb-button><span slot="prefix">+</span>Add</mb-button>');
    expect(part(element, 'prefix').hidden).to.equal(false);
  });

  it('type="submit" submits its form, and the default type does not', async () => {
    const { button, submits } = await formWith('<mb-button>Plain</mb-button><mb-button type="submit">Send</mb-button>');
    await driver.click(part(button, 'base'));
    expect(submits).to.have.length(0);
    await driver.click(part(document.querySelector('mb-button[type=submit]') as MbButton, 'base'));
    expect(submits).to.have.length(1);
  });

  it('type="submit" submits its name and value, and leaves no proxy behind', async () => {
    const { form } = await formWith('<mb-button type="submit" name="action" value="save">Save</mb-button>');
    const submitted: { value: string | undefined; data: [string, FormDataEntryValue][] }[] = [];
    form.addEventListener('submit', (event) => {
      const submitter = event.submitter as HTMLButtonElement | null;
      submitted.push({ value: submitter?.value, data: [...new FormData(form, submitter)] });
    });
    await driver.click(part(form.querySelector('mb-button') as MbButton, 'base'));
    expect(submitted).to.deep.equal([{ value: 'save', data: [['city', 'Oslo'], ['action', 'save']] }]);
    expect(form.querySelectorAll('button')).to.have.length(0);
  });

  it('type="reset" resets its form', async () => {
    const { form, button } = await formWith('<mb-button type="reset">Reset</mb-button>');
    (form.elements.namedItem('city') as HTMLInputElement).value = 'Rome';
    await driver.click(part(button, 'base'));
    expect((form.elements.namedItem('city') as HTMLInputElement).value).to.equal('Oslo');
  });

  it('click() activates the button like a native button, once, and submits', async () => {
    const { button, submits } = await formWith('<mb-button type="submit">Send</mb-button>');
    let clicks = 0;
    button.addEventListener('click', () => (clicks += 1));
    button.click();
    expect(submits).to.have.length(1);
    expect(clicks).to.equal(1);
  });

  it('click() on a disabled button does not submit', async () => {
    const { button, submits } = await formWith('<mb-button type="submit" disabled>Send</mb-button>');
    button.click();
    expect(submits).to.have.length(0);
  });

  it('disabled disables the native button and does not submit', async () => {
    const { button, submits } = await formWith('<mb-button type="submit" disabled>Send</mb-button>');
    expect(part<HTMLButtonElement>(button, 'base').disabled).to.equal(true);
    await driver.click(part(button, 'base'));
    expect(submits).to.have.length(0);
  });

  it('a disabled fieldset disables it', async () => {
    const { element: form } = await mount<HTMLFormElement>(
      '<form><fieldset disabled><mb-button type="submit">Send</mb-button></fieldset></form>',
    );
    const button = form.querySelector('mb-button') as MbButton;
    await settle(form);
    expect(part<HTMLButtonElement>(button, 'base').disabled).to.equal(true);
    (form.querySelector('fieldset') as HTMLFieldSetElement).disabled = false;
    await settle(form);
    expect(part<HTMLButtonElement>(button, 'base').disabled).to.equal(false);
  });

  it('focusing the host focuses the native button', async () => {
    const { element } = await mount<MbButton>('<mb-button>Save</mb-button>');
    element.focus();
    expect(element.shadowRoot?.activeElement).to.equal(part(element, 'base'));
  });

  it('keeps reflected attributes off the host unless set', async () => {
    const { element } = await mount<MbButton>('<mb-button>Save</mb-button>');
    expect(element.getAttributeNames()).to.deep.equal([]);
  });

  it('Enter in a text field submits through a submit mb-button, once', async () => {
    const { element: form } = await mount<HTMLFormElement>(
      '<form><input name="user"><input name="pass" type="password"><mb-button type="submit">Sign in</mb-button></form>',
    );
    const submits: number[] = [];
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submits.push(1);
    });
    (form.querySelector('input[name=pass]') as HTMLInputElement).focus();
    await sendKeys({ press: 'Enter' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(submits).to.have.length(1);
  });

  it('Enter submits once when the form also has one text field only', async () => {
    const { element: form } = await mount<HTMLFormElement>(
      '<form><input name="q"><mb-button type="submit">Search</mb-button></form>',
    );
    const submits: number[] = [];
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submits.push(1);
    });
    (form.querySelector('input') as HTMLInputElement).focus();
    await sendKeys({ press: 'Enter' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(submits).to.have.length(1);
  });

  it('Enter leaves submission to a native submit button when there is one', async () => {
    const { element: form } = await mount<HTMLFormElement>(
      '<form><input name="a"><input name="b"><button>Native</button><mb-button type="submit">Send</mb-button></form>',
    );
    const submitters: (string | undefined)[] = [];
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitters.push(event.submitter?.localName);
    });
    (form.querySelector('input') as HTMLInputElement).focus();
    await sendKeys({ press: 'Enter' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(submitters).to.deep.equal(['button']);
  });

  it('Enter does not submit when the submit mb-button is disabled', async () => {
    const { element: form } = await mount<HTMLFormElement>(
      '<form><input name="a"><input name="b"><mb-button type="submit" disabled>Send</mb-button></form>',
    );
    const submits: number[] = [];
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submits.push(1);
    });
    (form.querySelector('input') as HTMLInputElement).focus();
    await sendKeys({ press: 'Enter' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(submits).to.have.length(0);
  });

  it('size sets height, padding, font size, and gap from the scale, md by default', async () => {
    const { container } = await mount(
      '<mb-button size="sm">A</mb-button><mb-button>B</mb-button><mb-button size="lg">C</mb-button><mb-button size="huge">D</mb-button>',
    );
    const [sm, md, lg, unknown] = [...container.querySelectorAll('mb-button')].map((button) =>
      getComputedStyle(part(button, 'base')),
    ) as [CSSStyleDeclaration, CSSStyleDeclaration, CSSStyleDeclaration, CSSStyleDeclaration];
    for (const [style, size] of [
      [sm, 'sm'],
      [md, 'md'],
      [lg, 'lg'],
      [unknown, 'md'],
    ] as const) {
      expect(style.minBlockSize, `${size} height`).to.equal(resolveLength(`--mb-size-${size}-height`));
      expect(style.paddingInlineStart, `${size} padding`).to.equal(resolveLength(`--mb-size-${size}-padding-inline`));
      expect(style.fontSize, `${size} font size`).to.equal(resolveLength(`--mb-size-${size}-font-size`));
      expect(style.columnGap, `${size} gap`).to.equal(resolveLength(`--mb-size-${size}-gap`));
    }
    expect(container.querySelectorAll('mb-button')[1]?.hasAttribute('size'), 'not reflected').to.equal(false);
    expect(md.minBlockSize).to.equal('40px');
  });

  it('a component token beats the size scale', async () => {
    const { element } = await mount<MbButton>('<mb-button size="lg" style="--mb-button-height: 50px">Go</mb-button>');
    expect(getComputedStyle(part(element, 'base')).minBlockSize).to.equal('50px');
  });

  it('sizes slotted prefix and suffix icons from the scale', async () => {
    const svg = '<svg slot="prefix" viewBox="0 0 16 16"></svg>';
    const { element } = await mount<MbButton>(`<mb-button size="lg">${svg}Go</mb-button>`);
    const icon = element.querySelector('svg') as SVGElement;
    expect(getComputedStyle(icon).width).to.equal(resolveLength('--mb-size-lg-icon'));
  });

  describe('motion', () => {
    before(() => setMotion(true));
    after(() => setMotion(false));
    afterEach(() => emulateMedia({ reducedMotion: 'no-preference' }));

    it('transitions colors and transform with the fast duration, or --mb-button-duration', async () => {
      const { container } = await mount(
        '<mb-button>Go</mb-button><div style="--mb-button-duration: 123ms"><mb-button>Go</mb-button></div>',
      );
      const [plain, tuned] = [...container.querySelectorAll('mb-button')].map((button) =>
        getComputedStyle(part(button, 'base')),
      ) as [CSSStyleDeclaration, CSSStyleDeclaration];
      expect(plain.transitionProperty).to.equal('background-color, color, border-color, transform');
      expect(plain.transitionDuration.split(', ')[0]).to.equal('0.12s');
      expect(tuned.transitionDuration.split(', ')[0]).to.equal('0.123s');
    });

    it('has no transition duration under reduced motion', async () => {
      await emulateMedia({ reducedMotion: 'reduce' });
      const { element } = await mount<MbButton>('<mb-button>Go</mb-button>');
      expect(getComputedStyle(part(element, 'base')).transitionDuration.split(', ')[0]).to.equal('0s');
    });
  });

  it('scales down while pressed, by --mb-button-press-scale', async () => {
    const { element } = await mount<MbButton>('<mb-button style="--mb-button-press-scale: 0.5">Go</mb-button>');
    const base = part(element, 'base');
    const box = base.getBoundingClientRect();
    await sendMouse({ type: 'move', position: [Math.round(box.left + box.width / 2), Math.round(box.top + box.height / 2)] });
    await sendMouse({ type: 'down' });
    const pressed = getComputedStyle(base).transform;
    await sendMouse({ type: 'up' });
    expect(pressed).to.equal('matrix(0.5, 0, 0, 0.5, 0, 0)');
  });

  it('darkens to solid-active while pressed, without scaling by default', async () => {
    const { element } = await mount<MbButton>('<mb-button color="primary">Go</mb-button>');
    const base = part(element, 'base');
    const box = base.getBoundingClientRect();
    await sendMouse({ type: 'move', position: [Math.round(box.left + box.width / 2), Math.round(box.top + box.height / 2)] });
    await sendMouse({ type: 'down' });
    const pressed = getComputedStyle(base);
    const [background, transform] = [pressed.backgroundColor, pressed.transform];
    await sendMouse({ type: 'up' });
    expect(background).to.equal(resolveColor('--mb-color-primary-solid-active'));
    expect(transform).to.equal('none');
  });

  it('outline has a 1.5px border in the role border color', async () => {
    // The token itself is 1.5px (checked via `width`, which browsers report
    // at full precision). `border-top-width` is snapped to a whole device
    // pixel by every engine at the test runner's 1x device scale, so the
    // button's rendered border is compared against that same snapped
    // resolution of the token rather than the un-snapped '1.5px' literal.
    expect(resolveLength('--mb-border-width-control'), 'token is 1.5px').to.equal('1.5px');
    const probe = document.createElement('div');
    probe.style.borderTopWidth = 'var(--mb-border-width-control)';
    probe.style.borderTopStyle = 'solid';
    document.body.append(probe);
    const snappedWidth = getComputedStyle(probe).borderTopWidth;
    probe.remove();

    const { element } = await mount<MbButton>('<mb-button variant="outline" color="primary">Go</mb-button>');
    const style = getComputedStyle(part(element, 'base'));
    expect(style.borderTopWidth).to.equal(snappedWidth);
    expect(style.borderTopColor).to.equal(resolveColor('--mb-color-primary-border'));
  });

  it('uses the medium weight', async () => {
    const { element } = await mount<MbButton>('<mb-button>Go</mb-button>');
    expect(getComputedStyle(part(element, 'base')).fontWeight).to.equal('500');
  });

  it('is square with only an icon, and stops being square when text arrives', async () => {
    const svg = '<svg slot="prefix" viewBox="0 0 16 16"></svg>';
    const { element } = await mount<MbButton>(`<mb-button aria-label="Add">${svg}</mb-button>`);
    const base = part(element, 'base');
    expect(base.classList.contains('icon-only')).to.equal(true);
    const square = base.getBoundingClientRect();
    expect([square.width, square.height]).to.deep.equal([40, 40]);
    element.append('Add item');
    await settle(document.body);
    expect(base.classList.contains('icon-only')).to.equal(false);
    expect(base.getBoundingClientRect().width).to.be.greaterThan(40);
  });

  it('is not square with whitespace-only default content and no icon', async () => {
    const { element } = await mount<MbButton>('<mb-button> </mb-button>');
    expect(part(element, 'base').classList.contains('icon-only')).to.equal(false);
  });

  it("stops being square when an existing label text node's data changes in place, not just when nodes are added", async () => {
    // slotchange fires when the set of assigned nodes changes, not when an existing text
    // node's `.data` is mutated in place, which is how Lit, React, and Vue update a child
    // text binding (they create the text node once, even for '', then set `.data` later).
    const svg = '<svg slot="prefix" viewBox="0 0 16 16"></svg>';
    const { element } = await mount<MbButton>(`<mb-button aria-label="Add">${svg}</mb-button>`);
    const label = document.createTextNode('');
    element.append(label);
    await settle(document.body);
    const base = part(element, 'base');
    expect(base.classList.contains('icon-only')).to.equal(true);
    label.data = 'Add item';
    await settle(document.body);
    expect(base.classList.contains('icon-only')).to.equal(false);
    expect(base.getBoundingClientRect().width).to.be.greaterThan(40);
  });

  it('reads dark tokens under the system dark preference', async () => {
    try {
      await emulateMedia({ colorScheme: 'dark' });
      const { element } = await mount<MbButton>('<mb-button color="primary">Go</mb-button>');
      expect(getComputedStyle(part(element, 'base')).backgroundColor).to.equal('rgb(123, 123, 255)');
    } finally {
      await emulateMedia({ colorScheme: 'light' });
    }
  });

  describe('with href', () => {
    const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

    afterEach(() => {
      history.replaceState(null, '', location.pathname + location.search);
    });

    it('renders a link with target, rel, and download passed through', async () => {
      const { element } = await mount<MbButton>(
        '<mb-button href="/docs" target="_blank" rel="noopener" download="notes.txt">Docs</mb-button>',
      );
      const base = part<HTMLAnchorElement>(element, 'base');
      expect(base.localName).to.equal('a');
      expect([base.getAttribute('href'), base.target, base.rel, base.getAttribute('download')]).to.deep.equal([
        '/docs',
        '_blank',
        'noopener',
        'notes.txt',
      ]);
      expect(getComputedStyle(base).textDecorationLine).to.equal('none');
    });

    it('omits target, rel, and download when they are not set', async () => {
      const { element } = await mount<MbButton>('<mb-button href="/docs">Docs</mb-button>');
      const base = part<HTMLAnchorElement>(element, 'base');
      expect(['target', 'rel', 'download'].filter((name) => base.hasAttribute(name))).to.deep.equal([]);
    });

    it('navigates on click and on Enter, not on Space', async () => {
      const { element } = await mount<MbButton>('<mb-button href="#linked">Go</mb-button>');
      await driver.click(part(element, 'base'));
      await tick();
      expect(location.hash, 'click').to.equal('#linked');
      history.replaceState(null, '', location.pathname + location.search);
      element.focus();
      await sendKeys({ press: 'Enter' });
      await tick();
      expect(location.hash, 'Enter').to.equal('#linked');
      history.replaceState(null, '', location.pathname + location.search);
      element.focus();
      await sendKeys({ press: 'Space' });
      await tick();
      expect(location.hash, 'Space').to.equal('');
    });

    it('never submits its form, even with type="submit"', async () => {
      const { button, submits } = await formWith('<mb-button type="submit" href="#linked">Go</mb-button>');
      await driver.click(part(button, 'base'));
      await tick();
      expect(submits).to.have.length(0);
    });

    it('Enter in a text field does not submit through a link button', async () => {
      const { element: form } = await mount<HTMLFormElement>(
        '<form><input name="a"><input name="b"><mb-button type="submit" href="#linked">Go</mb-button></form>',
      );
      const submits: number[] = [];
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submits.push(1);
      });
      (form.querySelector('input') as HTMLInputElement).focus();
      await sendKeys({ press: 'Enter' });
      await tick();
      expect(submits).to.have.length(0);
    });

    it('disabled: no href, aria-disabled, not focusable, does not navigate', async () => {
      const { element } = await mount<MbButton>('<mb-button href="#linked" disabled>Off</mb-button>');
      const base = part<HTMLAnchorElement>(element, 'base');
      expect(base.hasAttribute('href')).to.equal(false);
      expect([base.getAttribute('role'), base.getAttribute('aria-disabled'), base.hasAttribute('tabindex')]).to.deep.equal(
        ['link', 'true', false],
      );
      element.focus();
      expect(element.shadowRoot?.activeElement ?? null).to.equal(null);
      base.focus();
      expect(element.shadowRoot?.activeElement ?? null, 'direct focus').to.equal(null);
      await driver.click(base);
      await tick();
      expect(location.hash).to.equal('');
      expect(getComputedStyle(base).color).to.equal(resolveColor('--mb-color-fg-disabled'));
    });

    it('focusing the host focuses the link', async () => {
      const { element } = await mount<MbButton>('<mb-button href="#linked">Go</mb-button>');
      element.focus();
      expect(element.shadowRoot?.activeElement).to.equal(part(element, 'base'));
    });

    it('keeps the variant and color tokens', async () => {
      const { element } = await mount<MbButton>('<mb-button href="#linked" variant="outline" color="primary">Go</mb-button>');
      const style = getComputedStyle(part(element, 'base'));
      expect(style.borderTopColor).to.equal(resolveColor('--mb-color-primary-border'));
      expect(style.color).to.equal(resolveColor('--mb-color-primary-text'));
    });

    it('passes axe, enabled and disabled', async () => {
      const { container } = await mount(
        '<main><mb-button href="#linked" color="primary">Docs</mb-button><mb-button href="#linked" disabled>Off</mb-button></main>',
      );
      await expectNoAxeViolations(container);
    });
  });
});
