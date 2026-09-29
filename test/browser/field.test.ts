import { expect } from 'chai';
import { attachField } from '../../src/core/dom/index.ts';
import { nextFrame } from '../../src/core/testing/index.ts';

describe('attachField', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('a reset callback already scheduled before dispose does nothing once disposed', async () => {
    const form = document.createElement('form');
    const label = document.createElement('label');
    label.textContent = 'Email';
    const control = document.createElement('input');
    control.type = 'email';
    control.required = true;
    const description = document.createElement('p');
    description.textContent = 'We never share it.';
    const error = document.createElement('p');
    form.append(label, control, description, error);
    document.body.append(form);

    const behavior = attachField({ control, label, description, error });
    control.value = 'x';
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new Event('focusout', { bubbles: true }));
    expect(control.getAttribute('aria-invalid'), 'invalid before reset').to.equal('true');

    // 'reset' fires synchronously and defers the field's work with
    // setTimeout. Disposing right after reset, in the same tick, must cancel
    // that pending work rather than let it run after dispose already tore
    // everything down.
    form.reset();
    behavior.dispose();

    await new Promise((resolve) => setTimeout(resolve, 0));
    await nextFrame();

    expect(control.hasAttribute('aria-invalid'), 'aria-invalid after dispose').to.equal(false);
    expect(control.hasAttribute('aria-describedby'), 'aria-describedby after dispose').to.equal(false);
    expect(control.hasAttribute('aria-labelledby'), 'aria-labelledby after dispose').to.equal(false);
    expect(label.hasAttribute('for'), 'label for after dispose').to.equal(false);
    expect(control.id, 'no id minted after dispose').to.equal('');
    expect(error.textContent, 'error text after dispose').to.equal('');
  });
});
