import type { LitElement, PropertyValues } from 'lit';
import type { Constructor } from './constructor.ts';

/** A failed check: the validity flags to set and the message to show. */
export interface ValidationResult {
  flags: ValidityStateFlags;
  message: string;
}

/** Returns a result when the element is invalid, or null when it passes. */
export type Validator = (element: FormAssociatedElement) => ValidationResult | null;

/** Public members added by {@link FormAssociated}. */
export interface FormAssociatedElement {
  /** Submitted with the form. Set the `value` attribute for the reset value. */
  value: string;
  name: string;
  disabled: boolean;
  required: boolean;
  /** Run after the built-in required check, in order. The first failure's message is shown. */
  validators: readonly Validator[];
  /** Created on first access. */
  readonly internals: ElementInternals;
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  checkValidity(): boolean;
  reportValidity(): boolean;
  formResetCallback(): void;
  formDisabledCallback(disabled: boolean): void;
  formStateRestoreCallback(state: string | File | FormData | null): void;
}

/** Fails with `valueMissing` when `required` is set and `value` is empty. */
export const requiredValidator: Validator = (element) =>
  element.required && element.value === ''
    ? { flags: { valueMissing: true }, message: 'Please fill out this field.' }
    : null;

function setState(states: CustomStateSet, name: string, on: boolean): void {
  if (on) states.add(name);
  else states.delete(name);
}

/**
 * Makes a Lit element a form control through `ElementInternals`.
 *
 * Custom states: `:state(invalid)` whenever a validator fails;
 * `:state(user-invalid)` once the user has changed the value and left the
 * control, or a form submission reported it, until the next reset. Use `:disabled` for the
 * disabled state; the platform matches it on form-associated elements.
 */
export function FormAssociated<T extends Constructor<LitElement>>(
  Base: T,
): T & Constructor<FormAssociatedElement> & { readonly formAssociated: true } {
  class FormAssociatedElementClass extends Base implements FormAssociatedElement {
    static readonly formAssociated = true as const;

    static properties = {
      value: { type: String },
      name: { type: String, reflect: true },
      disabled: { type: Boolean, reflect: true },
      required: { type: Boolean, reflect: true },
      validators: { attribute: false },
    };

    declare value: string;
    declare name: string;
    declare disabled: boolean;
    declare required: boolean;
    declare validators: readonly Validator[];

    #internals: ElementInternals | undefined;
    #interacted = false;
    #edited = false;

    // Mixin constructors must accept any arguments.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      super(...args);
      this.value = '';
      this.name = '';
      this.disabled = false;
      this.required = false;
      this.validators = [];
      // Like :user-invalid, leaving the control counts only after the user changed it.
      this.addEventListener('focusout', () => {
        if (this.#edited) this.#markInteracted();
      });
      this.addEventListener('invalid', () => {
        this.#markInteracted();
      });
    }

    get internals(): ElementInternals {
      return (this.#internals ??= this.attachInternals());
    }

    get form(): HTMLFormElement | null {
      return this.internals.form;
    }

    get validity(): ValidityState {
      return this.internals.validity;
    }

    get validationMessage(): string {
      return this.internals.validationMessage;
    }

    checkValidity(): boolean {
      return this.internals.checkValidity();
    }

    reportValidity(): boolean {
      return this.internals.reportValidity();
    }

    protected override updated(changed: PropertyValues): void {
      super.updated(changed);
      if (changed.has('value')) {
        this.internals.setFormValue(this.value);
        if (this.matches(':focus-within')) this.#edited = true;
      }
      if (changed.has('value') || changed.has('required') || changed.has('validators')) {
        this.#validate();
      }
    }

    formResetCallback(): void {
      this.value = this.getAttribute('value') ?? '';
      this.#interacted = false;
      this.#edited = false;
      this.#syncStates();
    }

    /** Re-renders so templates can read `this.matches(':disabled')`, which includes a disabled fieldset. */
    formDisabledCallback(): void {
      this.requestUpdate();
    }

    formStateRestoreCallback(state: string | File | FormData | null): void {
      if (typeof state === 'string') this.value = state;
    }

    #validate(): void {
      const failures = [requiredValidator, ...this.validators]
        .map((validator) => validator(this))
        .filter((result): result is ValidationResult => result !== null);
      const flags = failures.reduce<ValidityStateFlags>((all, failure) => ({ ...all, ...failure.flags }), {});
      const message = failures.length === 0 ? '' : failures[0]?.message || 'Invalid value.';
      this.internals.setValidity(flags, message);
      this.#syncStates();
    }

    #markInteracted(): void {
      this.#interacted = true;
      this.#syncStates();
    }

    #syncStates(): void {
      const invalid = !this.internals.validity.valid;
      setState(this.internals.states, 'invalid', invalid);
      setState(this.internals.states, 'user-invalid', invalid && this.#interacted);
    }
  }
  return FormAssociatedElementClass;
}
