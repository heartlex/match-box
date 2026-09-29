import { expect } from 'chai';
import { interactionTypes, nextFrame, type Audit, type Driver } from './driver.ts';
import { nameOf } from './names.ts';

export interface CheckboxGroupFixture {
  form: HTMLFormElement;
  /** The element with the group role (or a `<fieldset>`). */
  group: HTMLElement;
  /** The "select all" checkbox input. */
  parent: HTMLInputElement;
  /** The item checkbox inputs, in order: Nuts, Honey, Yogurt (disabled), Seeds. */
  items: readonly HTMLInputElement[];
  /** The group's validation message. */
  validationMessage(): string;
  teardown(): void;
}

export interface CheckboxGroupSuiteOptions {
  name: string;
  /**
   * Mounts a required group named "Toppings" with a select-all parent and
   * four unchecked items, Nuts, Honey, Yogurt (disabled), and Seeds, inside a form.
   */
  mount: () => CheckboxGroupFixture | Promise<CheckboxGroupFixture>;
  driver: Driver;
  audit?: Audit;
}

/** Registers the checkbox group conformance suite (WAI-ARIA APG checkbox pattern, mixed parent). */
export function checkboxGroupConformance({ name, mount, driver, audit }: CheckboxGroupSuiteOptions): void {
  for (const interaction of interactionTypes) {
    describe(`${name}: checkbox group conformance (${interaction})`, () => {
      let fixture: CheckboxGroupFixture;

      beforeEach(async () => {
        fixture = await mount();
        await nextFrame();
      });

      afterEach(() => {
        fixture.teardown();
      });

      const toggle = async (input: HTMLInputElement): Promise<void> => {
        if (interaction === 'keyboard') {
          input.focus();
          await driver.press('Space');
        } else {
          await driver.click(input);
        }
        await nextFrame();
      };

      const parentState = (): string =>
        fixture.parent.indeterminate ? 'mixed' : fixture.parent.checked ? 'checked' : 'unchecked';
      const checked = (): boolean[] => fixture.items.map((item) => item.checked);

      it('is a group named Toppings', async () => {
        const { group } = fixture;
        const role = group.getAttribute('role') ?? (group.localName === 'fieldset' ? 'group' : null);
        expect(role).to.equal('group');
        expect(nameOf(group)).to.equal('Toppings');
        if (audit) await audit(group);
      });

      it('shows the parent as unchecked, mixed, then checked', async () => {
        const [nuts, honey, , seeds] = fixture.items as [HTMLInputElement, HTMLInputElement, HTMLInputElement, HTMLInputElement];
        expect(parentState()).to.equal('unchecked');
        await toggle(nuts);
        expect(parentState()).to.equal('mixed');
        await toggle(honey);
        await toggle(seeds);
        expect(parentState(), 'every enabled item checked').to.equal('checked');
      });

      it('the parent checks every enabled item, then unchecks them', async () => {
        await toggle(fixture.parent);
        expect(checked()).to.deep.equal([true, true, false, true]);
        expect(parentState()).to.equal('checked');
        await toggle(fixture.parent);
        expect(checked()).to.deep.equal([false, false, false, false]);
        expect(parentState()).to.equal('unchecked');
      });

      it('the parent checks all from mixed', async () => {
        await toggle(fixture.items[0]);
        await toggle(fixture.parent);
        expect(checked()).to.deep.equal([true, true, false, true]);
      });

      it('requires at least one checked item', async () => {
        expect(fixture.form.checkValidity()).to.equal(false);
        expect(fixture.validationMessage()).to.equal('Select at least one option.');
        await toggle(fixture.items[1]);
        expect(fixture.form.checkValidity()).to.equal(true);
        expect(fixture.validationMessage()).to.equal('');
      });

      it('resets with its form', async () => {
        await toggle(fixture.items[0]);
        fixture.form.reset();
        // The reset event fires before the controls reset: wait a task.
        await new Promise((resolve) => setTimeout(resolve));
        expect(checked()).to.deep.equal([false, false, false, false]);
        expect(parentState()).to.equal('unchecked');
        expect(fixture.form.checkValidity()).to.equal(false);
      });
    });
  }
}
