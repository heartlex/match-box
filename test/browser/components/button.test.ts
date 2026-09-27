import { expect } from 'chai';
import '../../../src/components/define/button.ts';
import type { MbButton } from '../../../src/components/index.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';
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

  it('type="reset" resets its form', async () => {
    const { form, button } = await formWith('<mb-button type="reset">Reset</mb-button>');
    (form.elements.namedItem('city') as HTMLInputElement).value = 'Rome';
    await driver.click(part(button, 'base'));
    expect((form.elements.namedItem('city') as HTMLInputElement).value).to.equal('Oslo');
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
});
