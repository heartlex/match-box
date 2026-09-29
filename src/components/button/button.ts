import { LitElement, html, nothing } from 'lit';
import { DelegatesFocus } from '../../lit/delegates-focus.ts';
import { colorRole, type ColorRole } from '../shared/color.ts';
import { sizeName, type Size } from '../shared/size.ts';
import { buttonStyles } from './button.styles.ts';

export type ButtonVariant = 'default' | 'outline' | 'ghost';

// Input types in which Enter submits the form (implicit submission).
const implicitSubmitTypes = new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'date',
  'month',
  'week',
  'time',
  'datetime-local',
  'number',
]);

function isNativeSubmit(element: Element): boolean {
  return (
    (element instanceof HTMLButtonElement && element.type === 'submit') ||
    (element instanceof HTMLInputElement && (element.type === 'submit' || element.type === 'image'))
  );
}
export type ButtonType = 'button' | 'submit' | 'reset';

/**
 * A button.
 *
 * With `type="submit"`, Enter in a text field of its form submits the form
 * when the form has no native submit button, as a native submit button
 * would. The first submit `mb-button` in the form handles it; a disabled one
 * blocks it. It submits as a native submit button would: `name` and `value`
 * join the form data, and it is the submitter a `<form method="dialog">`
 * takes its return value from.
 *
 * With `href` it renders a link instead: Enter follows it, Space does not,
 * and it never submits or resets a form. A disabled link has no `href`, is
 * `aria-disabled`, and cannot be focused.
 *
 * @tag mb-button
 * @slot - The label.
 * @slot prefix - Content before the label, such as an icon.
 * @slot suffix - Content after the label.
 * @csspart base - The native button, or the link when `href` is set.
 * @csspart label - The label wrapper.
 * @csspart prefix - The prefix wrapper.
 * @csspart suffix - The suffix wrapper.
 * @cssprop --mb-button-bg - Background.
 * @cssprop --mb-button-bg-hover - Background on hover.
 * @cssprop --mb-button-fg - Text color.
 * @cssprop --mb-button-border-color - Border color.
 * @cssprop --mb-button-border-width - Border width.
 * @cssprop --mb-button-radius - Corner radius.
 * @cssprop --mb-button-height - Minimum height.
 * @cssprop --mb-button-padding-inline - Horizontal padding.
 * @cssprop --mb-button-gap - Space between prefix, label, and suffix.
 * @cssprop --mb-button-font-family - Font family.
 * @cssprop --mb-button-font-size - Font size.
 * @cssprop --mb-button-font-weight - Font weight.
 * @cssprop --mb-button-icon-size - Size of slotted prefix and suffix icons.
 * @cssprop --mb-button-duration - Duration of color and press transitions.
 * @cssprop --mb-button-press-scale - Scale while pressed.
 */
export class MbButton extends DelegatesFocus(LitElement) {
  static formAssociated = true;
  static override styles = buttonStyles;
  static override properties = {
    variant: {},
    color: {},
    size: {},
    type: {},
    name: {},
    value: {},
    href: {},
    target: {},
    rel: {},
    download: {},
    disabled: { type: Boolean, reflect: true },
  };

  /** The structure: filled, outlined, or background-free until hover. Unknown values render as `default`. */
  declare variant: ButtonVariant;
  /** The color role. */
  declare color: ColorRole;
  /** Height, padding, font size, and icon size, from the size scale. Unknown values render as `md`. */
  declare size: Size;
  /** What the button does in a form. */
  declare type: ButtonType;
  /** The name submitted with `value`, as on a native submit button. */
  declare name: string;
  /** The value submitted with `name`; a `<form method="dialog">` returns it. */
  declare value: string;
  /** Renders a link to this URL instead of a button. */
  declare href: string | undefined;
  /** The link's browsing context, such as `_blank`. Only with `href`. */
  declare target: string | undefined;
  /** The link's relationship, such as `noopener`. Only with `href`. */
  declare rel: string | undefined;
  /** Downloads the link's target, with this file name if not empty. Only with `href`. */
  declare download: string | undefined;
  declare disabled: boolean;

  readonly #internals: ElementInternals;
  #form: HTMLFormElement | null = null;
  #formDisabled = false;
  #hasPrefix = false;
  #hasSuffix = false;

  constructor() {
    super();
    this.variant = 'default';
    this.color = 'neutral';
    this.size = 'md';
    this.type = 'button';
    this.name = '';
    this.value = '';
    this.href = undefined;
    this.target = undefined;
    this.rel = undefined;
    this.download = undefined;
    this.disabled = false;
    this.#internals = this.attachInternals();
  }

  /** The form this button submits or resets, if any. */
  get form(): HTMLFormElement | null {
    return this.#internals.form;
  }

  /** Called by the platform when the button joins or leaves a form. */
  formAssociatedCallback(form: HTMLFormElement | null): void {
    this.#form?.removeEventListener('keydown', this.#onFormKeydown);
    this.#form = form;
    form?.addEventListener('keydown', this.#onFormKeydown);
  }

  /** Called by the platform when a `<fieldset>` ancestor is disabled or enabled. */
  formDisabledCallback(disabled: boolean): void {
    this.#formDisabled = disabled;
    this.requestUpdate();
  }

  /** Activates the button, like a native button's click(). */
  override click(): void {
    const base = this.renderRoot.querySelector<HTMLElement>('[part=base]');
    if (base) base.click();
    else super.click();
  }

  override render() {
    const classes = `variant-${this.variant} color-${colorRole(this.color)} size-${sizeName(this.size)}`;
    const content = html`<span part="prefix" ?hidden=${!this.#hasPrefix}
        ><slot name="prefix" @slotchange=${this.#onPrefixChange}></slot
      ></span>
      <span part="label"><slot></slot></span>
      <span part="suffix" ?hidden=${!this.#hasSuffix}
        ><slot name="suffix" @slotchange=${this.#onSuffixChange}></slot
      ></span>`;
    // A fieldset does not disable links, so only `disabled` applies.
    if (this.href != null) {
      return html`<a
        part="base"
        class=${classes}
        href=${this.disabled ? nothing : this.href}
        target=${this.target ?? nothing}
        rel=${this.rel ?? nothing}
        download=${this.download ?? nothing}
        role=${this.disabled ? 'link' : nothing}
        aria-disabled=${this.disabled ? 'true' : nothing}
        >${content}</a
      >`;
    }
    return html`<button
      part="base"
      class=${classes}
      type="button"
      ?disabled=${this.disabled || this.#formDisabled}
      @click=${this.#onClick}
    >
      ${content}
    </button>`;
  }

  #onPrefixChange(event: Event): void {
    this.#hasPrefix = hasContent(event);
    this.requestUpdate();
  }

  #onSuffixChange(event: Event): void {
    this.#hasSuffix = hasContent(event);
    this.requestUpdate();
  }

  readonly #onFormKeydown = (event: KeyboardEvent): void => {
    const form = this.#form;
    if (form === null || this.type !== 'submit' || this.href != null) return;
    if (event.key !== 'Enter' || event.defaultPrevented || event.isComposing) return;
    const target = event.composedPath()[0];
    if (!(target instanceof HTMLInputElement) || !implicitSubmitTypes.has(target.type) || target.form !== form) return;
    const elements = [...form.elements];
    // A native submit button is the form's default button; the platform handles Enter.
    if (elements.some(isNativeSubmit)) return;
    const first = elements.find(
      (element) => element instanceof MbButton && element.type === 'submit' && element.href == null,
    );
    if (first !== this) return;
    event.preventDefault();
    if (!this.disabled && !this.#formDisabled) this.#submit(form);
  };

  #onClick(): void {
    const form = this.#internals.form;
    if (form === null) return;
    if (this.type === 'submit') this.#submit(form);
    else if (this.type === 'reset') form.reset();
  }

  // A custom element cannot be a submitter, so a temporary native submit
  // button carries `name` and `value` into the form data and `event.submitter`.
  #submit(form: HTMLFormElement): void {
    const proxy = document.createElement('button');
    proxy.type = 'submit';
    proxy.hidden = true;
    if (this.name) proxy.name = this.name;
    proxy.value = this.value;
    form.append(proxy);
    try {
      form.requestSubmit(proxy);
    } finally {
      proxy.remove();
    }
  }
}

function hasContent(event: Event): boolean {
  return (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
}
