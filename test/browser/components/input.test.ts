import { expect } from 'chai';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import '../../../src/components/define/button.ts';
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

  it('is not validated while readonly, like a native input', async () => {
    const { input: a } = await inForm('<mb-input required readonly aria-label="R"></mb-input>');
    expect(a.validity.valid, 'required readonly, empty').to.equal(true);
    expect(a.checkValidity()).to.equal(true);
    const { input: b } = await inForm('<mb-input type="email" readonly value="x" aria-label="R"></mb-input>');
    expect(b.validity.valid, 'type mismatch, readonly').to.equal(true);
    a.readonly = false;
    await settle(document.body);
    expect(a.validity.valueMissing, 'valueMissing once writable again').to.equal(true);
  });

  it('keeps badInput, like a native input, when typing leaves the value unchanged', async () => {
    const { element: form } = await mount<HTMLFormElement>(
      '<form><input type="number" aria-label="N" /><mb-input type="number" aria-label="M"></mb-input></form>',
    );
    const native = form.querySelector('input') as HTMLInputElement;
    const input = form.querySelector('mb-input') as MbInput;
    await typeInto(native, '-');
    await typeInto(input, '-');
    expect(input.validity.badInput, 'badInput').to.equal(native.validity.badInput);
    expect(input.validity.badInput, 'badInput set').to.equal(true);
  });

  it('clears a malformed value on reset', async () => {
    const { form, input } = await inForm('<mb-input type="number" aria-label="N"></mb-input>');
    await typeInto(input, '-');
    form.reset();
    await settle(document.body);
    expect(inner(input).validity.badInput, 'badInput after reset').to.equal(false);
  });

  it('is valid again after a reset clears a malformed value', async () => {
    const { form, input } = await inForm('<mb-input type="number" aria-label="N"></mb-input>');
    await typeInto(input, '-');
    expect(input.validity.badInput, 'badInput before reset').to.equal(true);
    form.reset();
    await settle(document.body);
    expect(input.validity.valid, 'host valid').to.equal(true);
    expect(form.checkValidity(), 'form valid').to.equal(true);
  });

  it('does not submit on Enter when the form default button is disabled', async () => {
    const { form, input } = await inForm(
      '<mb-input name="q" aria-label="Search"></mb-input><button disabled>Send</button>',
    );
    let submitted = 0;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted += 1;
    });
    await typeInto(input, 'lit');
    await sendKeys({ press: 'Enter' });
    expect(submitted).to.equal(0);
  });

  it('activates the form default button on Enter, as the submitter', async () => {
    const { form, input } = await inForm(
      '<mb-input name="q" aria-label="Search"></mb-input><button name="action" value="save">Save</button>',
    );
    let submitter: EventTarget | null = null;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitter = event.submitter;
    });
    await typeInto(input, 'lit');
    await sendKeys({ press: 'Enter' });
    expect(submitter).to.equal(form.querySelector('button'));
  });

  it('activates a submit mb-button as the default button on Enter', async () => {
    const { form, input } = await inForm(
      '<mb-input name="q" aria-label="Search"></mb-input><mb-button type="submit">Send</mb-button>',
    );
    let submitted = 0;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted += 1;
    });
    await typeInto(input, 'lit');
    await sendKeys({ press: 'Enter' });
    expect(submitted).to.equal(1);
  });

  it('does not submit on Enter when the default mb-button is disabled', async () => {
    const { form, input } = await inForm(
      '<mb-input name="q" aria-label="Search"></mb-input><mb-button type="submit" disabled>Send</mb-button>',
    );
    let submitted = 0;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted += 1;
    });
    await typeInto(input, 'lit');
    await sendKeys({ press: 'Enter' });
    expect(submitted).to.equal(0);
  });

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

  it('does not submit on Enter with two fields and no submit button, like native inputs', async () => {
    const { element: container } = await mount<HTMLDivElement>(
      `<div><form id="native"><input name="a" aria-label="A"><input name="b" aria-label="B"><button type="button">X</button></form>
      <form id="custom"><mb-input name="a" aria-label="A"></mb-input><mb-input name="b" aria-label="B"></mb-input
      ><mb-button type="button">X</mb-button></form></div>`,
    );
    const submitted: string[] = [];
    for (const form of container.querySelectorAll('form')) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitted.push(form.id);
      });
    }
    await typeInto(container.querySelector('#native input') as HTMLInputElement, 'x');
    await sendKeys({ press: 'Enter' });
    await typeInto(container.querySelector('#custom mb-input') as MbInput, 'x');
    await sendKeys({ press: 'Enter' });
    await settle(document.body);
    expect(submitted).to.deep.equal([]);
  });

  it('does not treat a submit mb-button with href as the default button', async () => {
    const { form, input } = await inForm(
      '<mb-input name="q" aria-label="Search"></mb-input><mb-button type="submit" href="#linked">Go</mb-button>',
    );
    const submitters: (EventTarget | null)[] = [];
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitters.push(event.submitter);
    });
    await typeInto(input, 'lit');
    await sendKeys({ press: 'Enter' });
    expect(submitters, 'one field: submits without a submitter').to.deep.equal([null]);
    form.insertAdjacentHTML('afterbegin', '<mb-input name="r" aria-label="Other"></mb-input>');
    await settle(document.body);
    input.focus();
    await sendKeys({ press: 'Enter' });
    expect(submitters, 'two fields: no submit').to.deep.equal([null]);
    expect(location.hash).not.to.equal('#linked');
  });

  it('does not submit on Enter while an IME is composing (Safari keyCode 229)', async () => {
    const { form, input } = await inForm('<mb-input name="q" aria-label="Search"></mb-input>');
    let submitted = 0;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted += 1;
    });
    inner(input).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 229, bubbles: true, composed: true }));
    await settle(document.body);
    expect(submitted).to.equal(0);
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
