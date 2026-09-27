import '../../../src/components/define/all.ts';
import type { MbDisclosure } from '../../../src/components/index.ts';
import { disclosureConformance } from '../../../src/core/testing/index.ts';
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
