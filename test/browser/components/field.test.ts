import { expect } from 'chai';
import { emulateMedia, sendKeys, sendMouse } from '@web/test-runner-commands';
import '../../../src/components/define/all.ts';
import type { MbField, MbInput } from '../../../src/components/index.ts';
import { nameOf, referencedText } from '../../../src/core/testing/names.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part, resolveColor, settle } from '../../support/components.ts';

const later = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

async function mountField(attributes = '', control = '<mb-input type="email" required></mb-input>') {
  const { element: form } = await mount<HTMLFormElement>(
    `<form><mb-field label="Email" description="We never share it." ${attributes}>${control}</mb-field><button>Send</button></form>`,
  );
  form.addEventListener('submit', (event) => event.preventDefault());
  const field = form.querySelector('mb-field') as MbField;
  const input = form.querySelector('mb-input') as MbInput;
  await settle(document.body);
  return { form, field, input, inner: part<HTMLInputElement>(input, 'input') };
}

describe('mb-field', () => {
  before(loadTokens);

  afterEach(async () => {
    document.body.replaceChildren();
    // Forced colors are emulated page-wide: reset it here so a failing assertion above can't
    // leak the mode into later tests.
    await emulateMedia({ forcedColors: 'none' });
  });

  it('names and describes its control', async () => {
    const { field, inner } = await mountField();
    expect(nameOf(inner)).to.equal('Email');
    expect(referencedText(inner, 'describedby')).to.equal('We never share it.');
    expect(part(field, 'label').textContent?.trim()).to.equal('Email');
    await expectNoAxeViolations(field);
  });

  it('uses the text of rich slots', async () => {
    const { inner } = await mountField(
      '',
      '<span slot="label">E<b>mail</b></span><mb-input required></mb-input>',
    );
    expect(nameOf(inner)).to.equal('Email');
  });

  it('shows the error attribute at once', async () => {
    const { field, inner } = await mountField('error="That address is taken."');
    expect(field.shownError).to.equal('That address is taken.');
    expect(inner.getAttribute('aria-invalid')).to.equal('true');
    expect(referencedText(inner, 'describedby')).to.contain('That address is taken.');
    expect(part(field, 'error').getAttribute('aria-live')).to.equal('polite');
  });

  it('shows the validation message only after the user changes the control and leaves', async () => {
    const { field, input } = await mountField();
    input.focus();
    await sendKeys({ type: 'x' });
    await settle(document.body);
    expect(field.shownError).to.equal('');
    await sendKeys({ press: 'Tab' });
    await settle(document.body);
    expect(field.shownError).to.equal(input.validationMessage);
    expect(field.shownError).not.to.equal('');
  });

  it('shows the error on a submit attempt and clears it on reset', async () => {
    const { form, field } = await mountField();
    form.requestSubmit();
    await settle(document.body);
    expect(field.shownError).not.to.equal('');
    form.reset();
    await later();
    await settle(document.body);
    expect(field.shownError).to.equal('');
  });

  it('focuses the control when the label is clicked', async () => {
    const { field, input, inner } = await mountField();
    const box = part(field, 'label').getBoundingClientRect();
    await sendMouse({ type: 'click', position: [Math.round(box.left + 4), Math.round(box.top + box.height / 2)] });
    expect(input.shadowRoot?.activeElement).to.equal(inner);
  });

  it('marks required controls with an aria-hidden asterisk', async () => {
    const { field } = await mountField();
    expect(part(field, 'required').hidden).to.equal(false);
    expect(part(field, 'required').getAttribute('aria-hidden')).to.equal('true');
    const optional = await mountField('', '<mb-input></mb-input>');
    expect(part(optional.field, 'required').hidden).to.equal(true);
  });

  it('passes its size to a control without its own', async () => {
    const { input } = await mountField('size="lg"');
    expect(input.size).to.equal('lg');
    const own = await mountField('size="lg"', '<mb-input size="sm"></mb-input>');
    expect(own.input.size).to.equal('sm');
  });

  it('renders without a field control', async () => {
    const { element } = await mount<MbField>('<mb-field label="Notes" description="Free text."><textarea aria-label="N"></textarea></mb-field>');
    expect(part(element, 'label').textContent?.trim()).to.equal('Notes');
    expect(element.shownError).to.equal('');
  });

  it('keeps its control bound after being moved elsewhere in the DOM', async () => {
    const { field, inner } = await mountField();
    const otherContainer = document.createElement('div');
    const button = document.createElement('button');
    document.body.append(otherContainer);
    otherContainer.append(field, button);
    await settle(document.body);
    inner.focus();
    await sendKeys({ type: 'x' });
    await settle(document.body);
    await sendKeys({ press: 'Tab' });
    await settle(document.body);
    expect(field.shownError).not.to.equal('');
    expect(inner.getAttribute('aria-invalid')).to.equal('true');
  });

  it('clears its text from a control moved out of it', async () => {
    const { form, input, inner } = await mountField('error="Bad"');
    expect([nameOf(inner), inner.getAttribute('aria-invalid')]).to.deep.equal(['Email', 'true']);
    const plain = document.createElement('div');
    form.append(plain);
    plain.append(input);
    await settle(document.body);
    await later();
    await settle(document.body);
    expect(nameOf(inner)).not.to.equal('Email');
    expect(inner.hasAttribute('aria-invalid')).to.equal(false);
    expect(referencedText(inner, 'describedby')).to.equal('');
  });

  it('clears its text from a control it rebinds away from', async () => {
    const { field, input, inner } = await mountField('error="Bad"');
    field.append(document.createElement('mb-input'));
    input.remove();
    document.body.append(input);
    await settle(document.body);
    await later();
    await settle(document.body);
    expect(nameOf(inner)).not.to.equal('Email');
    expect(inner.hasAttribute('aria-invalid')).to.equal(false);
  });

  it('a control moved into another field takes the new field text', async () => {
    const { form, input, inner } = await mountField();
    form.insertAdjacentHTML('beforeend', '<mb-field label="Work email"></mb-field>');
    const other = form.querySelectorAll('mb-field')[1];
    other.append(input);
    await settle(document.body);
    await later();
    await settle(document.body);
    expect(nameOf(inner)).to.equal('Work email');
  });

  it('reflects text edited in place inside a rich slot', async () => {
    const { field, inner } = await mountField(
      '',
      '<span slot="error">Taken</span><mb-input type="email" required></mb-input>',
    );
    await settle(document.body);
    expect(referencedText(inner, 'describedby')).to.contain('Taken');
    const span = field.querySelector('span[slot="error"]') as HTMLSpanElement;
    span.textContent = 'Still taken';
    await settle(document.body);
    expect(referencedText(inner, 'describedby')).to.contain('Still taken');
    span.textContent = '';
    await settle(document.body);
    expect(field.shownError).to.equal('');
    expect(inner.getAttribute('aria-invalid')).to.equal(null);
  });

  it('gives the error no space when empty, and space only once it is shown', async () => {
    const { field } = await mountField();
    await settle(document.body);
    // The description is the row right before the error (the render order is control,
    // description, error), so it is the anchor for "nothing after this takes space".
    const emptyDescriptionRect = part(field, 'description').getBoundingClientRect();
    const emptyHostRect = field.getBoundingClientRect();
    expect(Math.abs(emptyHostRect.bottom - emptyDescriptionRect.bottom)).to.be.lessThanOrEqual(0.5);

    field.error = 'That address is taken.';
    await field.updateComplete;
    await settle(document.body);
    const filledDescriptionRect = part(field, 'description').getBoundingClientRect();
    const filledHostRect = field.getBoundingClientRect();
    expect(filledHostRect.bottom - filledDescriptionRect.bottom).to.be.greaterThan(0);
  });

  describe('matchbox look', () => {
    it('renders the description below the control', async () => {
      const { field } = await mountField();
      const position = part(field, 'control').compareDocumentPosition(part(field, 'description'));
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).to.not.equal(0);
    });

    it('uses a 12px medium label and a danger-text required marker', async () => {
      const { field } = await mountField();
      const label = getComputedStyle(part(field, 'label'));
      expect([label.fontSize, label.fontWeight]).to.deep.equal(['12px', '500']);
      expect(getComputedStyle(part(field, 'required')).color).to.equal(resolveColor('--mb-color-danger-text'));
    });

    it('shows the error as a banner with an icon, and nothing when there is no error', async () => {
      const { field } = await mountField();
      expect(part(field, 'error').getBoundingClientRect().height).to.equal(0);
      expect(field.shadowRoot?.querySelector('[part~=error-icon]')).to.equal(null);
      field.error = 'Bad';
      await settle(document.body);
      const banner = getComputedStyle(part(field, 'error'));
      expect(banner.backgroundColor).to.equal(resolveColor('--mb-color-bg-danger'));
      expect(banner.color).to.equal(resolveColor('--mb-color-fg-danger'));
      const icon = part(field, 'error-icon');
      expect(icon.getAttribute('aria-hidden')).to.equal('true');
      expect(part(field, 'error').textContent?.trim()).to.equal('Bad');
    });

    it('keeps a visible boundary on the banner in forced colors', async () => {
      await emulateMedia({ forcedColors: 'active' });
      const { field } = await mountField('error="Bad"');
      expect(getComputedStyle(part(field, 'error')).borderTopStyle).to.equal('solid');
    });
  });
});
