import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { live } from 'lit/directives/live.js';
import { CheckboxGroupState } from '../../core/state/checkbox-group.ts';
import { DelegatesFocus } from '../../lit/delegates-focus.ts';
import { FormAssociated } from '../../lit/form-associated.ts';
import { MbCheckbox } from '../checkbox/checkbox.ts';
import { colorRole, type ColorRole } from '../shared/color.ts';
import { fieldControlProperties, fieldText, linkField, type FieldControl } from '../shared/field-control.ts';
import { sizeName, type Size } from '../shared/size.ts';
import { groupSyncEvent } from '../shared/toggle.ts';
import { checkboxGroupStyles } from './checkbox-group.styles.ts';

/**
 * `mb-checkbox`es that submit and validate together, like a `<select multiple>`.
 *
 * @tag mb-checkbox-group
 * @slot - `mb-checkbox` elements. Their own `name` is ignored.
 * @csspart group - The element with the group role.
 * @csspart select-all - The "select all" `mb-checkbox`, with `select-all`.
 * @cssstate invalid - `required` with nothing checked.
 * @cssstate user-invalid - Invalid after the user changed the group and left, or a submit was attempted.
 * @cssprop --mb-checkbox-group-gap - Space between checkboxes.
 * @fires input - After the user changes the selection with "select all".
 * @fires change - After the user changes the selection with "select all"; a child's own `change` bubbles through.
 */
export class MbCheckboxGroup extends DelegatesFocus(FormAssociated(LitElement)) implements FieldControl {
  static override styles = checkboxGroupStyles;
  static override properties = {
    selectAll: { type: Boolean, attribute: 'select-all' },
    selectAllLabel: { attribute: 'select-all-label' },
    color: {},
    size: {},
    hostLabel: { attribute: 'aria-label' },
    ...fieldControlProperties,
  };

  /** Adds a parent checkbox that checks or unchecks every enabled child. */
  declare selectAll: boolean;
  declare selectAllLabel: string;
  /** Passed to children without their own `color`. */
  declare color: ColorRole;
  /** Passed to children without their own `size`. */
  declare size: Size;
  /** The host's `aria-label`, forwarded to the group. */
  declare hostLabel: string | null;
  /** Set by `mb-field`. */
  declare fieldLabel: string;
  /** Set by `mb-field`. */
  declare fieldDescription: string;
  /** Set by `mb-field`. */
  declare fieldError: string;

  /** The checked state of the children, keyed by index. */
  readonly state = new CheckboxGroupState();

  constructor() {
    super();
    this.selectAll = false;
    this.selectAllLabel = 'Select all';
    this.color = 'neutral';
    this.size = 'md';
    this.hostLabel = null;
    this.fieldLabel = '';
    this.fieldDescription = '';
    this.fieldError = '';
    this.state.subscribe(() => this.#apply());
    this.addEventListener('change', (event) => {
      if (event.target === this || !(event.target instanceof MbCheckbox)) return;
      this.markEdited();
      this.#read();
    });
    // A child's checked/disabled/value can change without a `change` event, e.g. set from a
    // script; toggle.ts notifies us directly so the state, FormData, and validity stay live.
    this.addEventListener(groupSyncEvent, () => this.#read());
  }

  /**
   * Values of the checked, enabled children, in order. A disabled child, or
   * every child while the group itself is disabled, is left out: like a
   * native checkbox, a disabled one is never submitted, so it cannot
   * satisfy "at least one" either.
   */
  get values(): string[] {
    if (this.#groupDisabled()) return [];
    return this.#children()
      .filter((child) => child.checked && !child.disabled)
      .map((child) => child.value);
  }

  set values(values: readonly string[]) {
    for (const child of this.#children()) child.checked = values.includes(child.value);
    this.#read();
  }

  /** Focuses "select all", or the first enabled checkbox. */
  override focus(options?: FocusOptions): void {
    const target = this.selectAll
      ? this.renderRoot.querySelector<HTMLElement>('[part=select-all]')
      : (this.#children().find((child) => !child.disabled) ?? null);
    if (target) target.focus(options);
    else super.focus(options);
  }

  override formResetCallback(): void {
    super.formResetCallback();
    // The children reset in their own callbacks; read them after all have run.
    queueMicrotask(() => this.#read());
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (state instanceof FormData) {
      this.values = state.getAll(this.name).filter((value): value is string => typeof value === 'string');
    }
  }

  // Not `value`: a checked child may submit ''.
  protected override isEmpty(): boolean {
    return this.values.length === 0;
  }

  protected override requiredMessage(): string {
    return 'Select at least one option.';
  }

  protected override validationAnchor(): HTMLElement | undefined {
    return this.#children()[0];
  }

  override formDisabledCallback(disabled: boolean): void {
    super.formDisabledCallback(disabled);
    // Fires only when the combined disabled state (own `disabled` OR an ancestor fieldset)
    // actually transitions, with `disabled` as that combined value; #groupDisabled() below
    // recomputes the same thing synchronously, so re-reading here just picks it up.
    this.#read();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    // Every child becomes (or stops being) excluded from "at least one" and FormData.
    // Read synchronously so render() right after sees it in this same cycle, not a cycle
    // later: #groupDisabled() is current here too (both `this.disabled` and the fieldset
    // attribute it checks are plain, unreflected reads, unlike `this.matches(':disabled')`).
    if (changed.has('disabled')) this.#read();
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    const disabled = this.#groupDisabled();
    for (const child of this.#children()) {
      child.groupDisabled = disabled;
      if (!child.hasAttribute('size')) child.size = this.size;
      if (!child.hasAttribute('color')) child.color = this.color;
    }
    const data = new FormData();
    for (const value of this.values) data.append(this.name, value);
    this.internals.setFormValue(this.name === '' ? null : data);
    const group = this.renderRoot.querySelector<HTMLElement>('[part=group]');
    if (group) linkField(group, this, this.renderRoot as ShadowRoot);
  }

  override render() {
    const parent = this.state.parentState;
    const disabled = this.#groupDisabled();
    return html`${fieldText(this)}
      <div part="group" role="group" aria-label=${this.hostLabel ?? nothing}>
        ${this.selectAll
          ? html`<mb-checkbox
              part="select-all"
              size=${sizeName(this.size)}
              color=${colorRole(this.color)}
              .checked=${live(parent === 'checked')}
              .indeterminate=${parent === 'mixed'}
              ?disabled=${disabled}
              @change=${this.#onSelectAll}
              >${this.selectAllLabel}</mb-checkbox
            >`
          : nothing}
        <slot @slotchange=${() => this.#read()}></slot>
      </div>`;
  }

  #children(): MbCheckbox[] {
    return [...this.children].filter((child): child is MbCheckbox => child instanceof MbCheckbox);
  }

  /** Own `disabled`, or an ancestor `<fieldset disabled>`: both current synchronously. */
  #groupDisabled(): boolean {
    return this.disabled || this.parentElement?.closest('fieldset:disabled') != null;
  }

  #read(): void {
    const disabled = this.#groupDisabled();
    this.state.setItems(
      this.#children().map((child, index) => ({
        key: String(index),
        checked: child.checked,
        disabled: disabled || child.disabled,
      })),
    );
    this.requestUpdate();
    // `required` depends on the children, which the mixin cannot see.
    this.revalidate();
  }

  #apply(): void {
    this.#children().forEach((child, index) => {
      const item = this.state.items[index];
      if (item !== undefined && child.checked !== item.checked) child.checked = item.checked;
    });
    this.requestUpdate();
    this.revalidate();
  }

  readonly #onSelectAll = (event: Event): void => {
    event.stopPropagation();
    this.state.toggleAll();
    this.markEdited();
    this.requestUpdate();
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };
}
