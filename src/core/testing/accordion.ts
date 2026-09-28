import { expect } from 'chai';
import { deepActiveElement } from '../a11y/active-element.ts';
import { interactionTypes, nextFrame, type Audit, type Driver } from './driver.ts';

export interface AccordionItemFixture {
  trigger: HTMLElement;
  panel: HTMLElement;
}

export interface AccordionMountSpec {
  multiple: boolean;
}

export interface AccordionFixture {
  /** Exactly three items, all collapsed, each trigger inside a heading. */
  items: readonly AccordionItemFixture[];
  teardown(): void;
}

export interface AccordionSuiteOptions {
  name: string;
  /** Mounts an accordion with three collapsed items into `document.body`. */
  mount: (spec: AccordionMountSpec) => AccordionFixture | Promise<AccordionFixture>;
  driver: Driver;
  audit?: Audit;
}

function headingOf(trigger: HTMLElement): Element | null {
  return trigger.closest('h1, h2, h3, h4, h5, h6, [role="heading"]');
}

/** Registers the accordion conformance suite (WAI-ARIA APG accordion pattern). */
export function accordionConformance({ name, mount, driver, audit }: AccordionSuiteOptions): void {
  for (const multiple of [false, true]) {
    for (const interaction of interactionTypes) {
      const mode = multiple ? 'multiple' : 'single';
      describe(`${name}: accordion conformance (${mode}, ${interaction})`, () => {
        let fixture: AccordionFixture;

        beforeEach(async () => {
          fixture = await mount({ multiple });
          await nextFrame();
        });

        afterEach(() => {
          fixture.teardown();
        });

        const item = (index: number): AccordionItemFixture => {
          const found = fixture.items[index];
          if (found === undefined) throw new Error(`no item ${index}`);
          return found;
        };

        const activate = async (index: number): Promise<void> => {
          const { trigger } = item(index);
          if (interaction === 'keyboard') {
            trigger.focus();
            await driver.press('Enter');
          } else {
            await driver.click(trigger);
          }
          await nextFrame();
        };

        const expectOpen = (indices: number[]): void => {
          fixture.items.forEach(({ trigger, panel }, index) => {
            const open = indices.includes(index);
            expect(trigger.getAttribute('aria-expanded'), `aria-expanded on item ${index}`).to.equal(String(open));
            expect(panel.checkVisibility({ visibilityProperty: true }), `panel ${index} visibility`).to.equal(open);
          });
        };

        it('exposes each trigger as a button in a heading that controls its panel', async () => {
          expect(fixture.items).to.have.length(3);
          for (const { trigger, panel } of fixture.items) {
            const isButton = trigger.localName === 'button' || trigger.getAttribute('role') === 'button';
            expect(isButton, 'trigger is a button').to.equal(true);
            expect(headingOf(trigger), 'trigger is inside a heading').not.to.equal(null);
            expect(trigger.ariaControlsElements?.[0]).to.equal(panel);
          }
          expectOpen([]);
          if (audit) await audit(item(0).trigger);
        });

        it('activating a collapsed item expands it, and activating it again collapses it', async () => {
          await activate(1);
          expectOpen([1]);
          if (audit) await audit(item(1).trigger);
          await activate(1);
          expectOpen([]);
        });

        if (multiple) {
          it('items open independently', async () => {
            await activate(0);
            await activate(2);
            expectOpen([0, 2]);
          });
        } else {
          it('expanding an item collapses the one that was open', async () => {
            await activate(0);
            await activate(2);
            expectOpen([2]);
          });
        }

        if (interaction === 'keyboard') {
          it('keeps focus on the activated trigger', async () => {
            await activate(0);
            await activate(1);
            expect(deepActiveElement()).to.equal(item(1).trigger);
          });
        }
      });
    }
  }
}
