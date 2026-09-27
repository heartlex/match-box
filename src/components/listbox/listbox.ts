import { LitElement, html, type PropertyValues } from 'lit';
import type { ListboxItem } from '../../core/state/listbox.ts';
import { ListboxController } from '../../lit/controllers.ts';
import { FormAssociated } from '../../lit/form-associated.ts';
import { colorRole, type ColorRole } from '../shared/color.ts';
import { listboxStyles } from './listbox.styles.ts';
import { MbOption } from './option.ts';

/**
 * A list of options to pick from, submitted with its form.
 *
 * @tag mb-listbox
 * @slot - `mb-option` elements.
 * @csspart label - The visible label, which also names the listbox. Without a `label` attribute, an associated `<label for>` names it instead.
 * @csspart listbox - The element with the listbox role.
 * @cssstate invalid - A validator fails, e.g. `required` with nothing selected.
 * @cssstate user-invalid - Invalid after the user changed the selection and left, or a submit was attempted.
 * @cssprop --mb-listbox-bg - Background.
 * @cssprop --mb-listbox-border-color - Border color.
 * @cssprop --mb-listbox-border-color-invalid - Border color when user-invalid.
 * @cssprop --mb-listbox-radius - Corner radius.
 * @cssprop --mb-listbox-padding - Padding around the options.
 * @cssprop --mb-listbox-max-height - Height after which the options scroll.
 * @fires input - After the user changes the selection.
 * @fires change - After the user changes the selection.
 */
export class MbListbox extends FormAssociated(LitElement) {
  static override styles = listboxStyles;
  static override properties = {
    label: {},
    multiple: { type: Boolean, reflect: true },
    color: {},
  };

  /** Visible label; also the listbox's accessible name. */
  declare label: string;
  declare multiple: boolean;
  /** The color role of selected options. */
  declare color: ColorRole;

  readonly listbox = new ListboxController(
    this,
    () => ({
      root: this.renderRoot.querySelector<HTMLElement>('[part=listbox]'),
      // The label attribute, else the first <label> associated with the host.
      label:
        this.label === ''
          ? ((this.internals.labels[0] ?? null) as HTMLElement | null)
          : this.renderRoot.querySelector<HTMLElement>('[part=label]'),
      items: () => this.#options(),
    }),
    { describeItem: (element) => this.#describe(element as MbOption) },
  );

  #initialized = false;
  #before: readonly string[] = [];
  readonly #observer: MutationObserver;

  constructor() {
    super();
    this.label = '';
    this.multiple = false;
    this.color = 'neutral';
    this.listbox.state.subscribe(() => {
      const first = this.values[0] ?? '';
      if (this.value !== first) this.value = first;
    });
    // Snapshot the selection before the core handles an event, compare after.
    for (const type of ['keydown', 'click'] as const) {
      this.addEventListener(type, () => (this.#before = this.values), { capture: true });
      this.addEventListener(type, (event) => {
        if (type === 'click' && event.target === this) this.focus();
        this.#emitIfChanged();
      });
    }
    this.#observer = new MutationObserver(() => this.requestUpdate());
  }

  /**
   * Values of the selected options, in option order. Only options that exist
   * count, like a native `<select>`; a selection set before its options
   * arrive applies once they do.
   */
  get values(): string[] {
    const selected = this.listbox.state.selected;
    const present = this.#options()
      .map((option) => option.value)
      .filter((value) => selected.has(value));
    return [...new Set(present)];
  }

  set values(values: readonly string[]) {
    this.listbox.state.setSelected(values);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['value', 'disabled', 'selected'],
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  /** Focuses the active option; the listbox itself is not focusable. */
  override focus(options?: FocusOptions): void {
    const active = this.#options()[this.listbox.state.activeIndex];
    if (active) active.focus(options);
    else super.focus(options);
  }

  override formResetCallback(): void {
    super.formResetCallback();
    this.listbox.state.setSelected(this.#defaultValues());
  }

  override formStateRestoreCallback(state: string | File | FormData | null): void {
    if (state instanceof FormData) {
      this.values = state.getAll(this.name).filter((value): value is string => typeof value === 'string');
    } else {
      super.formStateRestoreCallback(state);
    }
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed);
    if (changed.has('multiple')) this.listbox.state.setMultiple(this.multiple);
    if (changed.has('value') && this.value !== (this.values[0] ?? '')) {
      this.listbox.state.setSelected(this.value === '' ? [] : [this.value]);
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed);
    if (!this.#initialized && this.#options().length > 0) {
      this.#initialized = true;
      if (this.listbox.state.selected.size === 0) this.listbox.state.setSelected(this.#defaultValues());
    }
    const data = new FormData();
    for (const value of this.values) data.append(this.name, value);
    this.internals.setFormValue(this.name === '' ? null : data);
  }

  override render() {
    return html`<span part="label" ?hidden=${this.label === ''}>${this.label}</span>
      <div part="listbox" class="color-${colorRole(this.color)} ${this.multiple ? 'multiple' : ''}">
        <slot @slotchange=${() => this.requestUpdate()}></slot>
      </div>`;
  }

  #options(): MbOption[] {
    return [...this.children].filter((child): child is MbOption => child instanceof MbOption);
  }

  #describe(option: MbOption): ListboxItem {
    return {
      key: option.value,
      label: option.textContent?.trim() ?? '',
      disabled: option.disabled || this.disabled || this.matches(':disabled'),
    };
  }

  #defaultValues(): string[] {
    return this.#options()
      .filter((option) => option.defaultSelected)
      .map((option) => option.value);
  }

  #emitIfChanged(): void {
    const after = this.values;
    const changed = after.length !== this.#before.length || after.some((value) => !this.#before.includes(value));
    this.#before = after;
    if (!changed) return;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
