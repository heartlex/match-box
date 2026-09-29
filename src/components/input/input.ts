import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { DelegatesFocus } from '../../lit/delegates-focus.ts';
import { FormAssociated, type ValidationResult } from '../../lit/form-associated.ts';
import { colorRole, type ColorRole } from '../shared/color.ts';
import { fieldControlProperties, fieldText, linkField, type FieldControl } from '../shared/field-control.ts';
import { sizeName, type Size } from '../shared/size.ts';
import { isImplicitSubmitField, isNativeSubmit, isSubmitMbButton } from '../shared/submit.ts';
import { inputStyles } from './input.styles.ts';

/** The input types `mb-input` renders. */
export const inputTypes = ['text', 'email', 'password', 'search', 'tel', 'url', 'number'] as const;

export type InputType = (typeof inputTypes)[number];

const validityFlags = [
  'valueMissing',
  'typeMismatch',
  'patternMismatch',
  'tooLong',
  'tooShort',
  'rangeUnderflow',
  'rangeOverflow',
  'stepMismatch',
  'badInput',
] as const;

const constraints = ['type', 'pattern', 'min', 'max', 'step', 'minlength', 'maxlength', 'readonly'] as const;

function inputType(value: string): InputType {
  return inputTypes.find((type) => type === value) ?? 'text';
}

/**
 * A single-line text control, submitted with its form. Its validity is the
 * inner native input's, so messages and the submit popup match `<input>`.
 *
 * @tag mb-input
 * @slot prefix - Content before the text, inside the box: an icon or a unit.
 * @slot suffix - Content after the text, inside the box: a unit or a button.
 * @csspart base - The box.
 * @csspart input - The native input.
 * @csspart prefix - The wrapper of the prefix slot.
 * @csspart suffix - The wrapper of the suffix slot.
 * @cssstate invalid - The value fails a check.
 * @cssstate user-invalid - Invalid after the user changed the value and left, or a submit was attempted.
 * @cssprop --mb-input-bg - Background.
 * @cssprop --mb-input-border-color - Border color.
 * @cssprop --mb-input-border-color-hover - Border color on hover.
 * @cssprop --mb-input-border-color-invalid - Border color when user-invalid.
 * @cssprop --mb-input-radius - Corner radius.
 * @cssprop --mb-input-height - Minimum height. Defaults to the size scale.
 * @cssprop --mb-input-padding-inline - Horizontal padding.
 * @cssprop --mb-input-font-size - Font size.
 * @cssprop --mb-input-placeholder-color - Placeholder color.
 * @cssprop --mb-input-duration - Duration of the border transition.
 * @fires input - As the user types.
 * @fires change - When the user commits a change, like a native input.
 */
export class MbInput extends DelegatesFocus(FormAssociated(LitElement)) implements FieldControl {
  static override styles = inputStyles;
  static override properties = {
    type: {},
    placeholder: {},
    readonly: { type: Boolean, reflect: true },
    minlength: { type: Number },
    maxlength: { type: Number },
    pattern: {},
    min: {},
    max: {},
    step: {},
    autocomplete: {},
    inputmode: {},
    color: {},
    size: {},
    hostLabel: { attribute: 'aria-label' },
    ...fieldControlProperties,
  };

  /** `text`, `email`, `password`, `search`, `tel`, `url`, or `number`. Unknown values render as `text`. */
  declare type: InputType;
  declare placeholder: string;
  declare readonly: boolean;
  declare minlength: number | undefined;
  declare maxlength: number | undefined;
  declare pattern: string;
  declare min: string;
  declare max: string;
  declare step: string;
  declare autocomplete: string;
  declare inputmode: string;
  /** The color role of the focus ring and hover border. */
  declare color: ColorRole;
  /** Height, padding, and font size, from the size scale. Unknown values render as `md`. */
  declare size: Size;
  /** The host's `aria-label`, forwarded to the input. */
  declare hostLabel: string | null;
  /** Set by `mb-field`. */
  declare fieldLabel: string;
  /** Set by `mb-field`. */
  declare fieldDescription: string;
  /** Set by `mb-field`. */
  declare fieldError: string;

  #hasPrefix = false;
  #hasSuffix = false;

  constructor() {
    super();
    this.type = 'text';
    this.placeholder = '';
    this.readonly = false;
    this.minlength = undefined;
    this.maxlength = undefined;
    this.pattern = '';
    this.min = '';
    this.max = '';
    this.step = '';
    this.autocomplete = '';
    this.inputmode = '';
    this.color = 'neutral';
    this.size = 'md';
    this.hostLabel = null;
    this.fieldLabel = '';
    this.fieldDescription = '';
    this.fieldError = '';
  }

  get #input(): HTMLInputElement | null {
    return this.renderRoot.querySelector('input');
  }

  /** Selects the text. */
  select(): void {
    this.#input?.select();
  }

  // A native readonly input is barred from constraint validation.
  protected override isEmpty(): boolean {
    return this.readonly ? false : super.isEmpty();
  }

  protected override intrinsicValidity(): ValidationResult | null {
    if (this.readonly) return null;
    const input = this.#input;
    if (input === null || input.validity.valid) return null;
    const flags: ValidityStateFlags = {};
    for (const flag of validityFlags) if (input.validity[flag]) flags[flag] = true;
    return { flags, message: input.validationMessage };
  }

  protected override validationAnchor(): HTMLElement | undefined {
    return this.#input ?? undefined;
  }

  // formResetCallback() may set `value` to what it already is (e.g. '' to ''), which Lit
  // treats as a no-op: no render, and live() would skip the write anyway, since a
  // malformed value (e.g. a lone "-") already reads back as '' from the native getter.
  // Write the input directly so a malformed value is actually cleared, then validate:
  // with no value change, the mixin would keep the stale badInput.
  override formResetCallback(): void {
    super.formResetCallback();
    const input = this.#input;
    if (input) input.value = this.value;
    this.revalidate();
    this.requestUpdate();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (constraints.some((name) => changed.has(name))) this.revalidate();
    const input = this.#input;
    if (input) {
      linkField(input, this, this.renderRoot as ShadowRoot, {
        fallback: this.hostLabel === null ? ([...this.internals.labels] as HTMLElement[]) : [],
      });
    }
  }

  override render() {
    const disabled = this.disabled || this.matches(':disabled');
    return html`${fieldText(this)}
      <div part="base" class="color-${colorRole(this.color)} size-${sizeName(this.size)}">
        <span part="prefix" ?hidden=${!this.#hasPrefix}><slot name="prefix" @slotchange=${this.#onPrefixChange}></slot></span>
        <input
          part="input"
          type=${inputType(this.type)}
          .value=${live(this.value)}
          placeholder=${this.placeholder || nothing}
          ?required=${this.required}
          ?disabled=${disabled}
          ?readonly=${this.readonly}
          minlength=${ifDefined(this.minlength)}
          maxlength=${ifDefined(this.maxlength)}
          pattern=${this.pattern || nothing}
          min=${this.min || nothing}
          max=${this.max || nothing}
          step=${this.step || nothing}
          autocomplete=${this.autocomplete || nothing}
          inputmode=${this.inputmode || nothing}
          aria-label=${this.hostLabel ?? nothing}
          @input=${this.#onInput}
          @change=${this.#onChange}
          @keydown=${this.#onKeydown}
        />
        <span part="suffix" ?hidden=${!this.#hasSuffix}><slot name="suffix" @slotchange=${this.#onSuffixChange}></slot></span>
      </div>`;
  }

  readonly #onInput = (event: Event): void => {
    const value = (event.target as HTMLInputElement).value;
    // badInput (e.g. a lone "-" in a number field) can leave the value unchanged at
    // '': Lit then sees no property change, so validity and :user-invalid would go stale.
    if (value === this.value) {
      this.revalidate();
      this.markEdited();
    } else {
      this.value = value;
    }
  };

  // change does not cross the shadow boundary; input does.
  readonly #onChange = (): void => {
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // The inner input is not in the host's form, so Enter would not submit it natively.
  // Native implicit submission goes through the form's default button; without one, it
  // submits only when the form has a single field that blocks implicit submission.
  // keyCode 229: Safari reports an IME's committing Enter with isComposing false.
  readonly #onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229) return;
    const form = this.form;
    if (form === null) return;
    const elements = [...form.elements];
    // The default button: the first submit button, in tree order.
    const button = elements.find((element) => isNativeSubmit(element) || isSubmitMbButton(element));
    if (button) {
      if (!button.matches(':disabled')) (button as HTMLElement).click();
    } else if (elements.filter((element) => element instanceof MbInput || isImplicitSubmitField(element)).length < 2) {
      form.requestSubmit();
    }
  };

  readonly #onPrefixChange = (event: Event): void => {
    this.#hasPrefix = (event.target as HTMLSlotElement).assignedNodes().length > 0;
    this.requestUpdate();
  };

  readonly #onSuffixChange = (event: Event): void => {
    this.#hasSuffix = (event.target as HTMLSlotElement).assignedNodes().length > 0;
    this.requestUpdate();
  };
}
