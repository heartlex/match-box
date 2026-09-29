import { expect } from 'chai';
import { sendMouse } from '@web/test-runner-commands';
import '../../../src/components/define/field.ts';
import '../../../src/components/define/listbox.ts';
import type { MbListbox, MbOption } from '../../../src/components/index.ts';
import { nameOf, referencedText } from '../../../src/core/testing/names.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part, resolveColor, resolveLength, setMotion, settle } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const fruit = '<mb-option>Apple</mb-option><mb-option value="b">Banana</mb-option><mb-option>Cherry</mb-option>';

async function mountListbox(attributes = '', options = fruit): Promise<MbListbox> {
  const { element } = await mount<MbListbox>(`<mb-listbox label="Fruit" ${attributes}>${options}</mb-listbox>`);
  return element;
}

const optionsOf = (listbox: MbListbox): MbOption[] => [...listbox.querySelectorAll('mb-option')];
const option = (listbox: MbListbox, index: number): MbOption => optionsOf(listbox)[index];

async function inForm(markup: string): Promise<{ form: HTMLFormElement; listbox: MbListbox }> {
  const { element: form } = await mount<HTMLFormElement>(`<form>${markup}</form>`);
  return { form, listbox: form.querySelector('mb-listbox') as MbListbox };
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

async function addOption(listbox: MbListbox, label: string): Promise<MbOption> {
  const added = document.createElement('mb-option');
  added.textContent = label;
  listbox.append(added);
  await settle(document.body);
  await tick();
  return added;
}

describe('mb-listbox', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('option value defaults to its text and follows text changes', async () => {
    const listbox = await mountListbox();
    expect(optionsOf(listbox).map((o) => o.value)).to.deep.equal(['Apple', 'b', 'Cherry']);
    option(listbox, 2).textContent = 'Date';
    await settle(document.body);
    listbox.value = 'Date';
    await settle(document.body);
    expect(option(listbox, 2).selected).to.equal(true);
  });

  it('value and values follow the selection in option order', async () => {
    const listbox = await mountListbox('multiple');
    listbox.values = ['Cherry', 'Apple'];
    await settle(document.body);
    expect([listbox.value, listbox.values]).to.deep.equal(['Apple', ['Apple', 'Cherry']]);
    listbox.value = 'b';
    await settle(document.body);
    expect(listbox.values).to.deep.equal(['b']);
  });

  it('submits one entry per selected value under its name', async () => {
    const { form, listbox } = await inForm(`<mb-listbox label="Fruit" name="fruit" multiple>${fruit}</mb-listbox>`);
    listbox.values = ['Apple', 'b'];
    await settle(document.body);
    expect(new FormData(form).getAll('fruit')).to.deep.equal(['Apple', 'b']);
  });

  it('required fails until something is selected', async () => {
    const { listbox } = await inForm(`<mb-listbox label="Fruit" name="fruit" required>${fruit}</mb-listbox>`);
    expect(listbox.validity.valueMissing).to.equal(true);
    listbox.value = 'Apple';
    await settle(document.body);
    expect(listbox.validity.valid).to.equal(true);
  });

  it('starts with options marked selected and returns to them on reset', async () => {
    const options = '<mb-option>Apple</mb-option><mb-option selected>Banana</mb-option>';
    const { form, listbox } = await inForm(`<mb-listbox label="Fruit" name="fruit">${options}</mb-listbox>`);
    expect(listbox.value).to.equal('Banana');
    listbox.value = 'Apple';
    await settle(document.body);
    form.reset();
    await settle(document.body);
    expect(listbox.value).to.equal('Banana');
  });

  it('a disabled fieldset disables every option', async () => {
    const { listbox } = await inForm(`<fieldset disabled><mb-listbox label="Fruit">${fruit}</mb-listbox></fieldset>`);
    await settle(document.body);
    expect(optionsOf(listbox).map((o) => o.getAttribute('aria-disabled'))).to.deep.equal(['true', 'true', 'true']);
  });

  it('fires input and change on user selection only', async () => {
    const listbox = await mountListbox();
    const events: string[] = [];
    listbox.addEventListener('input', () => events.push('input'));
    listbox.addEventListener('change', () => events.push('change'));
    listbox.value = 'Cherry';
    await settle(document.body);
    expect(events).to.deep.equal([]);
    await driver.click(option(listbox, 0));
    expect(events).to.deep.equal(['input', 'change']);
    await driver.click(option(listbox, 0));
    expect(events).to.deep.equal(['input', 'change']);
  });

  it('focus() and a label click move focus to the active option', async () => {
    const { container } = await mount(`<label for="fruit">Fruit</label><mb-listbox id="fruit" label="Fruit">${fruit}</mb-listbox>`);
    const listbox = container.querySelector('mb-listbox') as MbListbox;
    listbox.focus();
    expect(document.activeElement).to.equal(option(listbox, 0));
    (document.activeElement as HTMLElement).blur();
    const box = (container.querySelector('label') as HTMLElement).getBoundingClientRect();
    await sendMouse({ type: 'click', position: [Math.round(box.left + 2), Math.round(box.top + 2)] });
    expect(document.activeElement).to.equal(option(listbox, 0));
  });

  it('turning multiple off keeps the first selected option and updates the ARIA', async () => {
    const listbox = await mountListbox('multiple');
    listbox.values = ['b', 'Cherry'];
    listbox.multiple = false;
    await settle(document.body);
    expect(listbox.values).to.deep.equal(['b']);
    expect(part(listbox, 'listbox').hasAttribute('aria-multiselectable')).to.equal(false);
  });

  it('names the listbox from its label', async () => {
    const listbox = await mountListbox();
    expect(part(listbox, 'listbox').ariaLabelledByElements?.[0]).to.equal(part(listbox, 'label'));
  });

  it('is named by a <label for> when it has no label attribute', async () => {
    const { container } = await mount(`<label for="fruit">Fruit</label><mb-listbox id="fruit">${fruit}</mb-listbox>`);
    const listbox = container.querySelector('mb-listbox') as MbListbox;
    // Compare identity as a boolean: chai's failure message for these two elements never finishes rendering.
    const label = container.querySelector('label');
    expect(part(listbox, 'listbox').ariaLabelledByElements?.[0] === label, 'labelled by the <label>').to.equal(true);
    await expectNoAxeViolations(container);
  });

  it('inside mb-field, takes its name and description from the field', async () => {
    const { element: form } = await mount<HTMLFormElement>(
      `<form><mb-field label="Fruit" description="Pick one."><mb-listbox label="Ignored" name="fruit" required>${fruit}</mb-listbox></mb-field></form>`,
    );
    const listbox = form.querySelector('mb-listbox') as MbListbox;
    form.addEventListener('submit', (event) => event.preventDefault());
    await settle(document.body);
    expect(part(listbox, 'label').hidden).to.equal(true);
    expect(nameOf(part(listbox, 'listbox'))).to.equal('Fruit');
    expect(referencedText(part(listbox, 'listbox'), 'describedby')).to.equal('Pick one.');
    form.requestSubmit();
    await settle(document.body);
    expect(part(listbox, 'listbox').getAttribute('aria-invalid')).to.equal('true');
    await expectNoAxeViolations(form);
  });

  it('drops a removed option from the value, the form, and validity', async () => {
    const { form, listbox } = await inForm(`<mb-listbox label="Fruit" name="fruit" required>${fruit}</mb-listbox>`);
    listbox.value = 'b';
    await settle(document.body);
    option(listbox, 1).remove();
    await settle(document.body);
    expect([listbox.value, listbox.values]).to.deep.equal(['', []]);
    expect(new FormData(form).getAll('fruit')).to.deep.equal([]);
    expect(listbox.validity.valueMissing).to.equal(true);
  });

  it('selects nothing for a value no option has', async () => {
    const listbox = await mountListbox();
    listbox.value = 'nonexistent';
    await settle(document.body);
    expect([listbox.value, listbox.values]).to.deep.equal(['', []]);
  });

  it('applies a selection set before its options exist once they arrive', async () => {
    const listbox = await mountListbox('multiple', '');
    listbox.values = ['Apple', 'Cherry'];
    listbox.insertAdjacentHTML('beforeend', fruit);
    await settle(document.body);
    expect(listbox.values).to.deep.equal(['Apple', 'Cherry']);
  });

  it('size sets every option height, padding, font size, gap, and check size, from the scale', async () => {
    for (const size of ['sm', 'md', 'lg']) {
      const listbox = await mountListbox(`size="${size}" multiple`);
      const base = getComputedStyle(part(option(listbox, 0), 'base'));
      expect(base.minBlockSize, `${size} height`).to.equal(resolveLength(`--mb-size-${size}-height`));
      expect(base.paddingInlineStart, `${size} padding`).to.equal(resolveLength(`--mb-size-${size}-padding-inline`));
      expect(base.fontSize, `${size} font size`).to.equal(resolveLength(`--mb-size-${size}-font-size`));
      expect(base.columnGap, `${size} gap`).to.equal(resolveLength(`--mb-size-${size}-gap`));
      const check = part(option(listbox, 0), 'check');
      expect(getComputedStyle(check).width, `${size} check`).to.equal(resolveLength(`--mb-size-${size}-icon`));

      // The check mark's centre must track the box's centre at every size, not just sm
      // (the offsets it used to have were tuned for the smallest box).
      option(listbox, 0).click();
      await settle(document.body);
      const checkRect = check.getBoundingClientRect();
      const mark = getComputedStyle(check, '::after');
      const markLeft = checkRect.left + Number.parseFloat(mark.left) + Number.parseFloat(mark.marginLeft);
      const markTop = checkRect.top + Number.parseFloat(mark.top) + Number.parseFloat(mark.marginTop);
      const markCenterX = markLeft + Number.parseFloat(mark.width) / 2;
      const markCenterY = markTop + Number.parseFloat(mark.height) / 2;
      expect(markCenterX, `${size} mark center x`).to.be.closeTo(checkRect.left + checkRect.width / 2, 1);
      expect(markCenterY, `${size} mark center y`).to.be.closeTo(checkRect.top + checkRect.height / 2, 1);

      document.body.replaceChildren();
    }
  });

  it('options are 2.5rem tall at md, and --mb-option-height wins', async () => {
    const listbox = await mountListbox();
    expect(part(option(listbox, 0), 'base').getBoundingClientRect().height).to.equal(40);
    listbox.style.setProperty('--mb-option-height', '50px');
    expect(getComputedStyle(part(option(listbox, 0), 'base')).minBlockSize).to.equal('50px');
  });

  describe('matchbox look', () => {
    it('is a raised panel: 8px radius, overlay shadow, 4px padding', async () => {
      const listbox = await mountListbox();
      const style = getComputedStyle(part(listbox, 'listbox'));
      expect(style.borderTopLeftRadius).to.equal('8px');
      expect(style.boxShadow).to.not.equal('none');
      expect(style.paddingTop).to.equal('4px');
    });

    it('tints the selected option with primary subtle and keeps default text', async () => {
      const listbox = await mountListbox();
      listbox.value = option(listbox, 1).value;
      await settle(document.body);
      const style = getComputedStyle(part(option(listbox, 1), 'base'));
      expect(style.backgroundColor).to.equal(resolveColor('--mb-color-primary-subtle'));
      expect(style.color).to.equal(resolveColor('--mb-color-fg-default'));
    });

    it('draws the multiple-mode check as a filled primary box when selected', async () => {
      // The token is 1.5px; every engine snaps a border-top-width to a whole
      // device pixel at the test runner's 1x scale, so the check's rendered
      // border is compared against that same snapped resolution rather than
      // the un-snapped '1.5px' literal (see button.test.ts).
      expect(resolveLength('--mb-border-width-control'), 'token is 1.5px').to.equal('1.5px');
      const probe = document.createElement('div');
      probe.style.borderTopWidth = 'var(--mb-border-width-control)';
      probe.style.borderTopStyle = 'solid';
      document.body.append(probe);
      const snappedWidth = getComputedStyle(probe).borderTopWidth;
      probe.remove();

      const listbox = await mountListbox('multiple');
      option(listbox, 0).click();
      await settle(document.body);
      const check = getComputedStyle(part(option(listbox, 0), 'check'));
      expect(check.backgroundColor).to.equal(resolveColor('--mb-color-primary-solid'));
      expect(check.borderTopWidth).to.equal(snappedWidth);
    });
  });

  describe('motion', () => {
    before(() => setMotion(true));
    after(() => setMotion(false));

    it('does not animate options present at the first render', async () => {
      const listbox = await mountListbox();
      await tick();
      expect(optionsOf(listbox).flatMap((o) => o.getAnimations())).to.have.length(0);
    });

    it('animates options added after the first render', async () => {
      const listbox = await mountListbox();
      const added = await addOption(listbox, 'Date');
      expect(added.getAnimations()).to.have.length(1);
      expect(optionsOf(listbox).slice(0, 3).flatMap((o) => o.getAnimations())).to.have.length(0);
    });

    it('animates options added after an empty first render', async () => {
      const listbox = await mountListbox('', '');
      const added = await addOption(listbox, 'Date');
      expect(added.getAnimations()).to.have.length(1);
    });

    it('does not animate an option that is moved', async () => {
      const listbox = await mountListbox();
      listbox.append(option(listbox, 0));
      await settle(document.body);
      await tick();
      expect(optionsOf(listbox).flatMap((o) => o.getAnimations())).to.have.length(0);
    });

    it('never starts an animation at 0ms', async () => {
      const listbox = await mountListbox('style="--mb-listbox-duration: 0ms"');
      const added = await addOption(listbox, 'Date');
      expect(added.getAnimations()).to.have.length(0);
    });

    it('an invalid duration or easing adds options without animating or throwing', async () => {
      const errors: unknown[] = [];
      const onError = (event: ErrorEvent): void => {
        errors.push(event.error);
      };
      window.addEventListener('error', onError);
      const garbled = await mountListbox('style="--mb-listbox-duration: fast"');
      const first = await addOption(garbled, 'Date');
      document.body.replaceChildren();
      const badEasing = await mountListbox('style="--mb-motion-easing-enter: wobbly"');
      const second = await addOption(badEasing, 'Date');
      window.removeEventListener('error', onError);
      expect(errors).to.deep.equal([]);
      expect(first.getAnimations()).to.have.length(0);
      expect(second.getAnimations()).to.have.length(1);
    });

    it('transitions the selection colors with the fast duration', async () => {
      const listbox = await mountListbox();
      expect(getComputedStyle(part(option(listbox, 0), 'base')).transitionDuration.split(', ')[0]).to.equal('0.12s');
    });
  });
});
