import { expect } from 'chai';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import { LitElement, html } from 'lit';
import { DelegatesFocus, FormAssociated } from '../../src/lit/index.ts';
import { TestField } from '../skin/lit-field.ts';
import { expectNoAxeViolations } from '../support/axe.ts';

async function mountForm(markup: string): Promise<{ form: HTMLFormElement; field: TestField }> {
  const form = document.createElement('form');
  form.innerHTML = markup;
  document.body.append(form);
  const field = form.querySelector('test-field') as TestField;
  await field.updateComplete;
  return { form, field };
}

async function typeInto(field: TestField, text: string): Promise<void> {
  field.focus();
  await sendKeys({ type: text });
  await field.updateComplete;
}

describe('FormAssociated', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('is form-associated and creates internals lazily', () => {
    const Plain = FormAssociated(LitElement);
    expect(Plain.formAssociated).to.equal(true);
    customElements.define('test-lazy-internals', class extends Plain {});
    const element = document.createElement('test-lazy-internals') as InstanceType<typeof Plain>;
    expect(element.internals).to.equal(element.internals);
  });

  it('submits its value with the form', async () => {
    const { form, field } = await mountForm('<test-field name="city"></test-field>');
    await typeInto(field, 'Oslo');
    expect(new FormData(form).get('city')).to.equal('Oslo');
  });

  it('reports valueMissing when required and empty', async () => {
    const { field } = await mountForm('<test-field name="city" required></test-field>');
    expect(field.validity.valueMissing).to.equal(true);
    expect(field.validationMessage).to.equal('Please fill out this field.');
    expect(field.matches(':state(invalid)')).to.equal(true);
    await typeInto(field, 'x');
    expect(field.validity.valid).to.equal(true);
    expect(field.matches(':state(invalid)')).to.equal(false);
  });

  it('runs custom validators and shows the first message', async () => {
    const { field } = await mountForm('<test-field name="code"></test-field>');
    field.validators = [
      (el) => (el.value.length < 3 ? { flags: { tooShort: true }, message: 'Too short.' } : null),
      (el) => (/^\d*$/.test(el.value) ? null : { flags: { patternMismatch: true }, message: 'Digits only.' }),
    ];
    await typeInto(field, 'a');
    expect(field.validity.tooShort).to.equal(true);
    expect(field.validity.patternMismatch).to.equal(true);
    expect(field.validationMessage).to.equal('Too short.');
  });

  it('sets user-invalid only after the user leaves the field', async () => {
    const { field } = await mountForm('<test-field required></test-field><button>after</button>');
    expect(field.matches(':state(user-invalid)')).to.equal(false);
    field.focus();
    (field.nextElementSibling as HTMLElement).focus();
    expect(field.matches(':state(user-invalid)')).to.equal(true);
  });

  it('resets to the value attribute and clears user-invalid', async () => {
    const { form, field } = await mountForm('<test-field value="start" required></test-field><button>after</button>');
    await typeInto(field, '!');
    (field.nextElementSibling as HTMLElement).focus();
    field.value = '';
    await field.updateComplete;
    expect(field.matches(':state(user-invalid)')).to.equal(true);
    form.reset();
    await field.updateComplete;
    expect(field.value).to.equal('start');
    expect(field.matches(':state(user-invalid)')).to.equal(false);
  });

  it('restores state from the browser', async () => {
    const { field } = await mountForm('<test-field></test-field>');
    field.formStateRestoreCallback('restored');
    await field.updateComplete;
    expect(field.value).to.equal('restored');
  });

  it('matches :disabled inside a disabled fieldset', async () => {
    const { form, field } = await mountForm('<fieldset disabled><test-field></test-field></fieldset>');
    expect(field.matches(':disabled')).to.equal(true);
    (form.querySelector('fieldset') as HTMLFieldSetElement).disabled = false;
    expect(field.matches(':disabled')).to.equal(false);
  });

  it('focuses the inner input when its label is clicked', async () => {
    const { field } = await mountForm('<label for="f">City</label><test-field id="f"></test-field>');
    const box = (document.querySelector('label') as HTMLElement).getBoundingClientRect();
    await sendMouse({ type: 'click', position: [Math.round(box.left + 2), Math.round(box.top + 2)] });
    expect(document.activeElement).to.equal(field);
    expect(field.shadowRoot?.activeElement?.localName).to.equal('input');
    await expectNoAxeViolations(field);
  });
});

describe('DelegatesFocus', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('keeps base shadow root options and adds delegatesFocus', async () => {
    class Base extends LitElement {
      static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, mode: 'open', slotAssignment: 'manual' };
    }
    const Delegating = DelegatesFocus(Base);
    expect(Delegating.shadowRootOptions).to.include({ delegatesFocus: true, slotAssignment: 'manual' });
    class TestDelegating extends DelegatesFocus(LitElement) {
      override render() {
        return html`<span>text</span><input aria-label="inner" />`;
      }
    }
    customElements.define('test-delegating', TestDelegating);
    const element = new TestDelegating();
    document.body.append(element);
    await element.updateComplete;
    element.focus();
    expect(element.shadowRoot?.activeElement?.localName).to.equal('input');
  });
});
