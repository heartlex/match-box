import { expect } from 'chai';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import '../../../src/components/define/input.ts';
import type { MbInput } from '../../../src/components/index.ts';
import { nameOf } from '../../../src/core/testing/names.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';

const inner = (element: MbInput): HTMLInputElement => part<HTMLInputElement>(element, 'input');

async function inForm(markup: string): Promise<{ form: HTMLFormElement; input: MbInput }> {
  const { element: form } = await mount<HTMLFormElement>(`<form>${markup}</form>`);
  return { form, input: form.querySelector('mb-input') as MbInput };
}

async function typeInto(target: HTMLElement, text: string): Promise<void> {
  target.focus();
  await sendKeys({ type: text });
  await settle(document.body);
}

describe('mb-input', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders each type, and text for an unknown one', async () => {
    for (const type of ['text', 'email', 'password', 'search', 'tel', 'url', 'number']) {
      const { element } = await mount<MbInput>(`<mb-input type="${type}" aria-label="X"></mb-input>`);
      expect(inner(element).type).to.equal(type);
    }
    const { element } = await mount<MbInput>('<mb-input type="date" aria-label="X"></mb-input>');
    expect(inner(element).type).to.equal('text');
  });

  it('submits what the user types', async () => {
    const { form, input } = await inForm('<mb-input name="city" aria-label="City"></mb-input>');
    await typeInto(input, 'Oslo');
    expect(new FormData(form).get('city')).to.equal('Oslo');
    expect(input.value).to.equal('Oslo');
  });

  it('resets to the value attribute, and the input shows it', async () => {
    const { form, input } = await inForm('<mb-input name="city" value="Rome" aria-label="City"></mb-input>');
    await typeInto(input, 'x');
    form.reset();
    await settle(document.body);
    expect([input.value, inner(input).value]).to.deep.equal(['Rome', 'Rome']);
  });

  it('setting value updates the input and validity', async () => {
    const { input } = await inForm('<mb-input type="email" aria-label="Email"></mb-input>');
    input.value = 'not-an-email';
    await settle(document.body);
    expect(inner(input).value).to.equal('not-an-email');
    expect(input.validity.typeMismatch).to.equal(true);
    input.value = 'a@b.co';
    await settle(document.body);
    expect(input.validity.valid).to.equal(true);
  });

  const cases: [string, string, keyof ValidityState][] = [
    ['type="email"', 'x', 'typeMismatch'],
    ['pattern="[0-9]+"', 'ab', 'patternMismatch'],
    ['type="number" min="5"', '3', 'rangeUnderflow'],
    ['type="number" max="5"', '9', 'rangeOverflow'],
    ['minlength="3"', 'ab', 'tooShort'],
    ['required', '', 'valueMissing'],
  ];
  for (const [attributes, text, flag] of cases) {
    it(`matches a native input for ${attributes} (${flag})`, async () => {
      const { element: form } = await mount<HTMLFormElement>(
        `<form><input ${attributes} aria-label="N" /><mb-input ${attributes} aria-label="M"></mb-input></form>`,
      );
      const native = form.querySelector('input') as HTMLInputElement;
      const input = form.querySelector('mb-input') as MbInput;
      if (text !== '') {
        await typeInto(native, text);
        await typeInto(input, text);
      }
      expect(input.validity[flag], flag).to.equal(native.validity[flag]);
      expect(input.validity[flag], `${flag} set`).to.equal(true);
      expect(input.validationMessage).to.equal(native.validationMessage);
    });
  }

  it('runs custom validators after the native checks', async () => {
    const { input } = await inForm('<mb-input type="email" aria-label="Email"></mb-input>');
    input.validators = [(element) => (element.value.endsWith('.test') ? { flags: { customError: true }, message: 'No .test.' } : null)];
    await typeInto(input, 'x');
    expect(input.validity.typeMismatch).to.equal(true);
    expect(input.validationMessage).not.to.equal('No .test.');
    input.value = 'a@b.test';
    await settle(document.body);
    expect([input.validity.customError, input.validationMessage]).to.deep.equal([true, 'No .test.']);
  });

  it('submits its form on Enter, like a native input', async () => {
    const { form, input } = await inForm('<mb-input name="q" aria-label="Search"></mb-input>');
    let submitted = 0;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted += 1;
    });
    await typeInto(input, 'lit');
    await sendKeys({ press: 'Enter' });
    expect(submitted).to.equal(1);
  });

  it('re-dispatches change from the host', async () => {
    const { input } = await inForm('<mb-input aria-label="City"></mb-input><button>b</button>');
    let changes = 0;
    input.addEventListener('change', () => (changes += 1));
    await typeInto(input, 'Oslo');
    await sendKeys({ press: 'Tab' });
    expect(changes).to.equal(1);
  });

  it('is named by a label for, or by aria-label on the host', async () => {
    const { element: container } = await mount<HTMLDivElement>(
      '<div><label for="city">City</label><mb-input id="city"></mb-input><mb-input aria-label="Town"></mb-input></div>',
    );
    const [first, second] = [...container.querySelectorAll('mb-input')] as [MbInput, MbInput];
    await settle(document.body);
    expect(nameOf(inner(first))).to.equal('City');
    expect(nameOf(inner(second))).to.equal('Town');
    await expectNoAxeViolations(container);
  });

  it('shows prefix and suffix only when slotted', async () => {
    const { element } = await mount<MbInput>(
      '<mb-input aria-label="Price"><span slot="suffix">€</span></mb-input>',
    );
    expect(part(element, 'prefix').hidden).to.equal(true);
    expect(part(element, 'suffix').hidden).to.equal(false);
  });

  it('focus() and a click on the box focus the input; select() selects its text', async () => {
    const { element } = await mount<MbInput>('<mb-input aria-label="City" value="Oslo"></mb-input>');
    element.focus();
    expect(element.shadowRoot?.activeElement).to.equal(inner(element));
    element.select();
    expect([inner(element).selectionStart, inner(element).selectionEnd]).to.deep.equal([0, 4]);
    inner(element).blur();
    const box = part(element, 'base').getBoundingClientRect();
    await sendMouse({ type: 'click', position: [Math.round(box.left + 2), Math.round(box.top + box.height / 2)] });
    expect(element.shadowRoot?.activeElement).to.equal(inner(element));
  });
});
