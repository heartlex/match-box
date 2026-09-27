import '../../../src/components/define/all.ts';
import type { MbAccordion, MbDialog, MbDisclosure } from '../../../src/components/index.ts';
import {
  accordionConformance,
  dialogConformance,
  disclosureConformance,
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
