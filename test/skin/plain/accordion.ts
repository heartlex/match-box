import { attachAccordion, attachDisclosure } from '../../../src/core/dom/index.ts';
import type { AccordionFixture, AccordionMountSpec } from '../../../src/core/testing/index.ts';

/** Minimal plain DOM accordion: three disclosures under h3 headings, coordinated by attachAccordion. */
export function mountPlainAccordion(spec: AccordionMountSpec): AccordionFixture {
  const container = document.createElement('div');
  container.innerHTML = ['Shipping', 'Returns', 'Warranty']
    .map((title) => `<h3><button type="button">${title}</button></h3><div hidden>${title} details</div>`)
    .join('');
  document.body.append(container);
  const triggers = [...container.querySelectorAll('button')];
  const disclosures = triggers.map((trigger) => {
    const panel = trigger.parentElement?.nextElementSibling as HTMLElement;
    const behavior = attachDisclosure({ trigger, panel });
    behavior.state.subscribe(() => {
      panel.hidden = !behavior.state.expanded;
    });
    return { trigger, panel, behavior };
  });
  const accordion = attachAccordion(
    { items: () => disclosures.map(({ behavior }) => behavior) },
    { multiple: spec.multiple },
  );
  return {
    items: disclosures.map(({ trigger, panel }) => ({ trigger, panel })),
    teardown() {
      accordion.dispose();
      for (const { behavior } of disclosures) behavior.dispose();
      container.remove();
    },
  };
}
