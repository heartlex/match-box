import { expect } from 'chai';
import { attachDisclosure } from '../../src/core/dom/index.ts';
import { disclosureConformance } from '../../src/core/testing/index.ts';
import { mountPlainDisclosure } from '../skin/plain/disclosure.ts';
import { expectNoAxeViolations } from '../support/axe.ts';
import { driver } from '../support/driver.ts';

disclosureConformance({ name: 'plain', mount: mountPlainDisclosure, driver, audit: expectNoAxeViolations });

describe('attachDisclosure', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('attachDisclosure gives a non-button trigger a button role and keyboard support', () => {
    const trigger = document.createElement('span');
    const panel = document.createElement('div');
    document.body.append(trigger, panel);
    const behavior = attachDisclosure({ trigger, panel });
    expect(trigger.getAttribute('role')).to.equal('button');
    expect(trigger.getAttribute('tabindex')).to.equal('0');
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(behavior.state.expanded).to.equal(true);
  });

  it('dispose removes every attribute and listener', () => {
    const trigger = document.createElement('button');
    const panel = document.createElement('div');
    document.body.append(trigger, panel);
    const behavior = attachDisclosure({ trigger, panel });
    behavior.dispose();
    expect(trigger.getAttributeNames()).to.deep.equal([]);
    expect(trigger.ariaControlsElements).to.equal(null);
    trigger.click();
    expect(behavior.state.expanded).to.equal(false);
  });
});
