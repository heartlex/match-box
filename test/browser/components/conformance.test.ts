import '../../../src/components/define/all.ts';
import type { MbAccordion, MbDialog, MbDisclosure, MbField, MbInput, MbListbox } from '../../../src/components/index.ts';
import {
  accordionConformance,
  dialogConformance,
  disclosureConformance,
  fieldConformance,
  listboxConformance,
} from '../../../src/core/testing/index.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const audit = expectNoAxeViolations;

before(loadTokens);

disclosureConformance({
  name: 'mb-disclosure',
  driver,
  audit,
  async mount() {
    const { element, container } = await mount<MbDisclosure>(
      '<mb-disclosure><span slot="summary">Shipping details</span>Ships in two days.</mb-disclosure>',
    );
    return { trigger: part(element, 'trigger'), panel: part(element, 'panel'), teardown: () => container.remove() };
  },
});

dialogConformance({
  name: 'mb-dialog',
  driver,
  audit,
  async mount() {
    const { element, container } = await mount<HTMLElement>(`
      <mb-button>Place order</mb-button>
      <mb-dialog label="Confirm order">
        <p>Your card will be charged now.</p>
        <form method="dialog" slot="footer"><button value="confirm">Confirm</button></form>
      </mb-dialog>`);
    const dialog = container.querySelector('mb-dialog') as MbDialog;
    element.addEventListener('click', () => dialog.show());
    return {
      trigger: part(element, 'base'),
      dialog: part<HTMLDialogElement>(dialog, 'dialog'),
      title: part(dialog, 'title'),
      confirm: container.querySelector('button[value=confirm]') as HTMLElement,
      teardown: () => container.remove(),
    };
  },
});

listboxConformance({
  name: 'mb-listbox',
  driver,
  audit,
  async mount(spec) {
    const options = spec.options
      .map((option) => `<mb-option${option.disabled ? ' disabled' : ''}>${option.label}</mb-option>`)
      .join('');
    const { element, container } = await mount<MbListbox>(
      `<mb-listbox label="Fruit"${spec.multiple ? ' multiple' : ''}>${options}</mb-listbox>`,
    );
    return {
      root: part(element, 'listbox'),
      options: [...element.querySelectorAll<HTMLElement>('mb-option')],
      teardown: () => container.remove(),
    };
  },
});

fieldConformance({
  name: 'mb-field + mb-input',
  driver,
  audit,
  async mount() {
    const { element: form, container } = await mount<HTMLFormElement>(
      '<form><mb-field label="Email" description="We never share it."><mb-input type="email" name="email" required></mb-input></mb-field><button>Send</button></form>',
    );
    form.addEventListener('submit', (event) => event.preventDefault());
    const field = form.querySelector('mb-field') as MbField;
    const input = form.querySelector('mb-input') as MbInput;
    return {
      control: part(input, 'input'),
      form,
      submit: form.querySelector('button') as HTMLElement,
      errorText: () => field.shownError,
      async setError(message) {
        field.error = message;
        await field.updateComplete;
        await input.updateComplete;
      },
      teardown: () => container.remove(),
    };
  },
});

accordionConformance({
  name: 'mb-accordion',
  driver,
  audit,
  async mount(spec) {
    const items = ['Shipping', 'Returns', 'Warranty']
      .map((title) => `<mb-disclosure><span slot="summary">${title}</span>${title} details.</mb-disclosure>`)
      .join('');
    const { element, container } = await mount<MbAccordion>(
      `<mb-accordion${spec.multiple ? ' multiple' : ''}>${items}</mb-accordion>`,
    );
    return {
      items: [...element.querySelectorAll<MbDisclosure>('mb-disclosure')].map((disclosure) => ({
        trigger: part(disclosure, 'trigger'),
        panel: part(disclosure, 'panel'),
      })),
      teardown: () => container.remove(),
    };
  },
});
