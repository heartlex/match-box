import { expect } from 'chai';
import { interactionTypes, nextFrame, type Audit, type Driver } from './driver.ts';
import { nameOf, referencedText } from './names.ts';

export interface FieldFixture {
  /** The focusable element whose name and description are checked (an `<input>`, or one in a shadow root). */
  control: HTMLElement;
  form: HTMLFormElement;
  /** Submits the form. The form never navigates. */
  submit: HTMLElement;
  /** The visible error text, or `''`. */
  errorText(): string;
  /** Sets a custom error (`''` clears it) and waits for it to render. */
  setError(message: string): Promise<void>;
  teardown(): void;
}

export interface FieldSuiteOptions {
  name: string;
  /**
   * Mounts an empty, required email field labelled "Email" and described
   * "We never share it.", inside a form with a submit button.
   */
  mount: () => FieldFixture | Promise<FieldFixture>;
  driver: Driver;
  audit?: Audit;
}

const settle = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextFrame();
};

/** Registers the field conformance suite: label, description, and error timing and wiring. */
export function fieldConformance({ name, mount, driver, audit }: FieldSuiteOptions): void {
  for (const interaction of interactionTypes) {
    describe(`${name}: field conformance (${interaction})`, () => {
      let fixture: FieldFixture;

      beforeEach(async () => {
        fixture = await mount();
        await nextFrame();
      });

      afterEach(() => {
        fixture.teardown();
      });

      const enter = async (): Promise<void> => {
        if (interaction === 'keyboard') fixture.control.focus();
        else await driver.click(fixture.control);
      };

      const leave = async (): Promise<void> => {
        if (interaction === 'keyboard') await driver.press('Tab');
        // Away from the field: its label, at the top left, would focus the control again.
        else await driver.click({ x: window.innerWidth - 2, y: window.innerHeight - 2 });
        await settle();
      };

      const type = async (text: string): Promise<void> => {
        for (const key of text) await driver.press(key);
        await settle();
      };

      const expectError = (shown: boolean): void => {
        expect(fixture.errorText() !== '', 'error shown').to.equal(shown);
        expect(fixture.control.getAttribute('aria-invalid') === 'true', 'aria-invalid').to.equal(shown);
        if (shown) expect(referencedText(fixture.control, 'describedby')).to.contain(fixture.errorText());
      };

      it('names and describes the control', async () => {
        expect(nameOf(fixture.control)).to.contain('Email');
        expect(referencedText(fixture.control, 'describedby')).to.contain('We never share it.');
        expectError(false);
        if (audit) await audit(fixture.control);
      });

      it('shows no error when the user only passes through', async () => {
        await enter();
        await leave();
        expectError(false);
      });

      it('shows the validation message after the user changes the control and leaves it', async () => {
        await enter();
        await type('x');
        expectError(false);
        await leave();
        expectError(true);
        if (audit) await audit(fixture.control);
      });

      it('shows the error on a submit attempt', async () => {
        if (interaction === 'keyboard') {
          fixture.control.focus();
          await driver.press('Enter');
        } else {
          await driver.click(fixture.submit);
        }
        await settle();
        expectError(true);
      });

      it('clears the error once the value is valid', async () => {
        await enter();
        await type('x');
        await leave();
        await enter();
        await driver.press('End');
        await type('@example.com');
        expectError(false);
      });

      it('clears the error on reset', async () => {
        await enter();
        await type('x');
        await leave();
        fixture.form.reset();
        await settle();
        expectError(false);
      });

      it('shows a custom error at once, until it is cleared', async () => {
        await fixture.setError('That address is taken.');
        expect(fixture.errorText()).to.equal('That address is taken.');
        expectError(true);
        await fixture.setError('');
        expectError(false);
      });
    });
  }
}
