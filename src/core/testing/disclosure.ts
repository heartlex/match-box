import { expect } from 'chai';
import { deepActiveElement } from '../a11y/active-element.ts';
import { interactionTypes, nextFrame, type Audit, type Driver } from './driver.ts';

export interface DisclosureFixture {
  trigger: HTMLElement;
  panel: HTMLElement;
  teardown(): void;
}

export interface DisclosureSuiteOptions {
  /** Names the implementation in test titles. */
  name: string;
  /** Mounts a collapsed disclosure into `document.body`. */
  mount: () => DisclosureFixture | Promise<DisclosureFixture>;
  driver: Driver;
  audit?: Audit;
}

/** Registers the disclosure conformance suite (WAI-ARIA APG disclosure pattern). */
export function disclosureConformance({ name, mount, driver, audit }: DisclosureSuiteOptions): void {
  for (const interaction of interactionTypes) {
    describe(`${name}: disclosure conformance (${interaction})`, () => {
      let fixture: DisclosureFixture;

      beforeEach(async () => {
        fixture = await mount();
        await nextFrame();
      });

      afterEach(() => {
        fixture.teardown();
      });

      const expectExpanded = (expanded: boolean): void => {
        expect(fixture.trigger.getAttribute('aria-expanded')).to.equal(String(expanded));
        expect(fixture.panel.checkVisibility(), 'panel visibility').to.equal(expanded);
      };

      const activate = async (key = 'Enter'): Promise<void> => {
        if (interaction === 'keyboard') {
          fixture.trigger.focus();
          await driver.press(key);
        } else {
          await driver.click(fixture.trigger);
        }
        await nextFrame();
      };

      it('starts collapsed with a button role that controls the panel', async () => {
        const { trigger, panel } = fixture;
        const isButton = trigger.localName === 'button' || trigger.getAttribute('role') === 'button';
        expect(isButton, 'trigger is a button').to.equal(true);
        expect(trigger.ariaControlsElements?.[0]).to.equal(panel);
        expectExpanded(false);
        if (audit) await audit(trigger);
      });

      it('expands and collapses the panel', async () => {
        await activate();
        expectExpanded(true);
        if (audit) await audit(fixture.trigger);
        await activate();
        expectExpanded(false);
      });

      // Pointer mode skips focus checks: WebKit, like Safari, does not focus buttons on click.
      if (interaction === 'keyboard') {
        it('keeps focus on the trigger', async () => {
          await activate();
          expect(deepActiveElement()).to.equal(fixture.trigger);
        });

        it('Space also toggles', async () => {
          await activate('Space');
          expectExpanded(true);
          await activate('Space');
          expectExpanded(false);
        });
      }
    });
  }
}
