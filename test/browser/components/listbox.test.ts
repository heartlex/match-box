import { expect } from 'chai';
import { sendMouse } from '@web/test-runner-commands';
import '../../../src/components/define/listbox.ts';
import type { MbListbox, MbOption } from '../../../src/components/index.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part, resolveLength, setMotion, settle } from '../../support/components.ts';
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
      expect(getComputedStyle(part(option(listbox, 0), 'check')).width, `${size} check`).to.equal(
        resolveLength(`--mb-size-${size}-icon`),
      );
      document.body.replaceChildren();
    }
  });

  it('options are 2.25rem tall at md, and --mb-option-height wins', async () => {
    const listbox = await mountListbox();
    expect(part(option(listbox, 0), 'base').getBoundingClientRect().height).to.equal(36);
    listbox.style.setProperty('--mb-option-height', '50px');
    expect(getComputedStyle(part(option(listbox, 0), 'base')).minBlockSize).to.equal('50px');
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
