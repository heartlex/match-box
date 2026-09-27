import { expect } from 'chai';
import { deepActiveElement } from '../a11y/active-element.ts';
import { interactionTypes, nextFrame, type Audit, type Driver } from './driver.ts';

export interface DialogFixture {
  /** Opens the dialog when activated. */
  trigger: HTMLElement;
  dialog: HTMLDialogElement;
  /** Labels the dialog. */
  title: HTMLElement;
  /** Closes the dialog with the return value `"confirm"`, e.g. `<button value="confirm">` in a `<form method="dialog">`. */
  confirm: HTMLElement;
  teardown(): void;
}

export interface DialogSuiteOptions {
  name: string;
  /** Mounts a closed dialog and its trigger into `document.body`. The dialog box must not cover the viewport's top-left corner. */
  mount: () => DialogFixture | Promise<DialogFixture>;
  driver: Driver;
  audit?: Audit;
}

/** Registers the modal dialog conformance suite (WAI-ARIA APG dialog pattern). */
export function dialogConformance({ name, mount, driver, audit }: DialogSuiteOptions): void {
  for (const interaction of interactionTypes) {
    describe(`${name}: dialog conformance (${interaction})`, () => {
      let fixture: DialogFixture;

      beforeEach(async () => {
        fixture = await mount();
        await nextFrame();
      });

      afterEach(() => {
        fixture.teardown();
      });

      const settle = async (): Promise<void> => {
        // The native close event is queued as a task.
        await new Promise((resolve) => setTimeout(resolve, 0));
        await nextFrame();
      };

      const activate = async (element: HTMLElement): Promise<void> => {
        if (interaction === 'keyboard') {
          element.focus();
          await driver.press('Enter');
        } else {
          await driver.click(element);
        }
        await settle();
      };

      it('opens as a labelled modal dialog with focus inside', async () => {
        await activate(fixture.trigger);
        const { dialog } = fixture;
        expect(dialog.open).to.equal(true);
        expect(dialog.matches(':modal'), 'modal').to.equal(true);
        expect(dialog.ariaLabelledByElements?.[0]).to.equal(fixture.title);
        expect(dialog.contains(deepActiveElement()), 'focus inside').to.equal(true);
        if (audit) await audit(dialog);
      });

      it('closes with the confirm value', async () => {
        await activate(fixture.trigger);
        await activate(fixture.confirm);
        expect(fixture.dialog.open).to.equal(false);
        expect(fixture.dialog.returnValue).to.equal('confirm');
      });

      if (interaction === 'keyboard') {
        it('Escape closes and returns focus to the trigger', async () => {
          await activate(fixture.trigger);
          await driver.press('Escape');
          await settle();
          expect(fixture.dialog.open).to.equal(false);
          expect(deepActiveElement()).to.equal(fixture.trigger);
        });

        it('returns focus to the trigger after confirming', async () => {
          await activate(fixture.trigger);
          await activate(fixture.confirm);
          expect(deepActiveElement()).to.equal(fixture.trigger);
        });
      } else {
        it('a click outside the dialog closes it', async () => {
          await activate(fixture.trigger);
          await driver.click({ x: 2, y: 2 });
          await settle();
          expect(fixture.dialog.open).to.equal(false);
        });

        it('a click inside the dialog keeps it open', async () => {
          await activate(fixture.trigger);
          await driver.click(fixture.title);
          await settle();
          expect(fixture.dialog.open).to.equal(true);
        });
      }
    });
  }
}
