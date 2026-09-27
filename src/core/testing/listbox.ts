import { expect } from 'chai';
import { deepActiveElement } from '../a11y/active-element.ts';
import { interactionTypes, nextFrame, type Audit, type Driver } from './driver.ts';

export interface ListboxOptionSpec {
  label: string;
  disabled?: boolean;
}

export interface ListboxMountSpec {
  multiple: boolean;
  options: readonly ListboxOptionSpec[];
}

export interface ListboxFixture {
  root: HTMLElement;
  /** Option elements, in the order of `spec.options`. */
  options: readonly HTMLElement[];
  teardown(): void;
}

export interface ListboxSuiteOptions {
  name: string;
  /**
   * Mounts a labelled listbox with nothing selected. Append it to the end of
   * `document.body`: the suite puts a start button first and tabs from it.
   */
  mount: (spec: ListboxMountSpec) => ListboxFixture | Promise<ListboxFixture>;
  driver: Driver;
  audit?: Audit;
}

/** The options every implementation is mounted with. Index 2 is disabled. */
export const listboxSuiteOptions: readonly ListboxOptionSpec[] = [
  { label: 'Apple' },
  { label: 'Banana' },
  { label: 'Cherry', disabled: true },
  { label: 'Date' },
  { label: 'Blueberry' },
];

/** Registers the listbox conformance suite (WAI-ARIA APG listbox pattern). */
export function listboxConformance({ name, mount, driver, audit }: ListboxSuiteOptions): void {
  for (const multiple of [false, true]) {
    for (const interaction of interactionTypes) {
      const mode = multiple ? 'multiple' : 'single';
      describe(`${name}: listbox conformance (${mode}, ${interaction})`, () => {
        let fixture: ListboxFixture;
        let start: HTMLButtonElement;

        beforeEach(async () => {
          start = document.createElement('button');
          start.textContent = 'start';
          document.body.prepend(start);
          fixture = await mount({ multiple, options: listboxSuiteOptions });
          await nextFrame();
        });

        afterEach(() => {
          fixture.teardown();
          start.remove();
        });

        const option = (index: number): HTMLElement => {
          const element = fixture.options[index];
          if (element === undefined) throw new Error(`no option ${index}`);
          return element;
        };

        const press = async (...keys: string[]): Promise<void> => {
          for (const key of keys) await driver.press(key);
          await nextFrame();
        };

        const click = async (index: number): Promise<void> => {
          await driver.click(option(index));
          await nextFrame();
        };

        const expectFocus = (index: number): void => {
          expect(deepActiveElement()).to.equal(option(index));
          const tabbable = fixture.options.filter((o) => o.getAttribute('tabindex') === '0');
          expect(tabbable, 'exactly one option in the tab sequence').to.deep.equal([option(index)]);
        };

        const expectSelected = (indices: number[]): void => {
          fixture.options.forEach((element, index) => {
            const selected = indices.includes(index);
            const expected = selected ? 'true' : multiple ? 'false' : null;
            expect(element.getAttribute('aria-selected'), `aria-selected on option ${index}`).to.equal(expected);
          });
        };

        const enter = async (): Promise<void> => {
          start.focus();
          await press('Tab');
        };

        it('exposes listbox and option roles and states', async () => {
          expect(fixture.root.getAttribute('role')).to.equal('listbox');
          expect(fixture.root.getAttribute('aria-multiselectable')).to.equal(multiple ? 'true' : null);
          expect(fixture.root.ariaLabelledByElements?.length, 'labelled').to.equal(1);
          for (const element of fixture.options) expect(element.getAttribute('role')).to.equal('option');
          expect(option(2).getAttribute('aria-disabled')).to.equal('true');
          expectSelected([]);
          if (audit) await audit(fixture.root);
        });

        if (interaction === 'keyboard') {
          it('Tab moves focus to the first option', async () => {
            await enter();
            expectFocus(0);
          });

          it('Down and Up Arrow move focus, skipping the disabled option', async () => {
            await enter();
            await press('ArrowDown');
            expectFocus(1);
            await press('ArrowDown');
            expectFocus(3);
            await press('ArrowUp');
            expectFocus(1);
          });

          it('Home and End move to the first and last option', async () => {
            await enter();
            await press('End');
            expectFocus(4);
            await press('Home');
            expectFocus(0);
          });

          it('Down Arrow on the last option keeps focus there', async () => {
            await enter();
            await press('End', 'ArrowDown');
            expectFocus(4);
          });

          it('Space selects the focused option', async () => {
            await enter();
            await press('Space');
            expectSelected([0]);
            await press('ArrowDown', 'Space');
            expectSelected(multiple ? [0, 1] : [1]);
            if (audit) await audit(fixture.root);
          });

          if (multiple) {
            it('Space on a selected option deselects it', async () => {
              await enter();
              await press('Space', 'Space');
              expectSelected([]);
            });
          }

          it('typing a character focuses the next option starting with it', async () => {
            await enter();
            await press('b');
            expectFocus(1);
            await press('b');
            expectFocus(4);
          });

          it('Tab back into the listbox returns to the selected option', async () => {
            await enter();
            await press('ArrowDown', 'ArrowDown', 'Space');
            start.focus();
            await press('Tab');
            expectFocus(3);
          });
        } else {
          it('clicking an option selects and focuses it', async () => {
            await click(1);
            expectSelected([1]);
            expectFocus(1);
          });

          it('clicking a disabled option does nothing', async () => {
            await click(2);
            expectSelected([]);
            expect(deepActiveElement()).not.to.equal(option(2));
          });

          it(multiple ? 'clicking toggles each option' : 'clicking another option moves the selection', async () => {
            await click(0);
            await click(3);
            expectSelected(multiple ? [0, 3] : [3]);
            await click(0);
            expectSelected(multiple ? [3] : [0]);
          });
        }
      });
    }
  }
}
