import { LitElement, html } from 'lit';
import { DialogController } from '../../lit/controllers.ts';
import { sizeName, type Size } from '../shared/size.ts';
import { dialogStyles } from './dialog.styles.ts';

/**
 * A modal dialog on the native `<dialog>` element.
 *
 * A `<form method="dialog">` inside closes the dialog with its submit
 * button's `value` as `returnValue`.
 *
 * @tag mb-dialog
 * @slot heading - The title. Defaults to `label`.
 * @slot - The body.
 * @slot footer - Actions, usually buttons.
 * @csspart dialog - The native dialog.
 * @csspart header - The header row.
 * @csspart title - The heading that labels the dialog.
 * @csspart close-button - The close button, an `mb-button`.
 * @csspart body - The body wrapper.
 * @csspart footer - The footer wrapper.
 * @cssstate open - The dialog is open.
 * @cssprop --mb-dialog-width - Maximum width. Overrides `size`.
 * @cssprop --mb-dialog-bg - Background.
 * @cssprop --mb-dialog-border-color - Border color.
 * @cssprop --mb-dialog-radius - Corner radius.
 * @cssprop --mb-dialog-shadow - Shadow.
 * @cssprop --mb-dialog-backdrop - Backdrop color.
 * @cssprop --mb-dialog-backdrop-blur - Backdrop blur radius.
 * @cssprop --mb-dialog-duration - Duration of the open and close animations.
 * @cssprop --mb-dialog-title-font-size - Title font size.
 * @fires close - After the dialog closes, for any reason.
 * @fires cancel - When Escape is pressed. Cancelable: preventing it keeps the dialog open.
 */
export class MbDialog extends LitElement {
  static override styles = dialogStyles;
  static override properties = {
    open: { type: Boolean, reflect: true, noAccessor: true },
    label: {},
    size: {},
    persistent: { type: Boolean, reflect: true },
    closeLabel: { attribute: 'close-label' },
  };

  /** The title, used when the `heading` slot is empty. */
  declare label: string;
  /** Maximum width, from the dialog widths. Unknown values render as `md`. */
  declare size: Size;
  /** Keep the dialog open on an outside click. Escape still closes it. */
  declare persistent: boolean;
  /** Accessible name of the close button. */
  declare closeLabel: string;

  readonly #dialog = new DialogController(
    this,
    () => ({
      dialog: this.renderRoot.querySelector('dialog'),
      title: this.renderRoot.querySelector<HTMLElement>('[part=title]'),
    }),
    { dismissOnOutsideClick: () => !this.persistent },
  );

  readonly #internals: ElementInternals;
  #hasFooter = false;

  constructor() {
    super();
    this.label = '';
    this.size = 'md';
    this.persistent = false;
    this.closeLabel = 'Close';
    this.#internals = this.attachInternals();
    this.#dialog.state.subscribe(() => {
      this.requestUpdate('open', !this.open);
      if (this.open) this.#internals.states.add('open');
      else this.#internals.states.delete('open');
    });
    this.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || form.method !== 'dialog' || form.closest('mb-dialog') !== this) return;
      event.preventDefault();
      const submitter = event.submitter as HTMLButtonElement | HTMLInputElement | null;
      this.close(submitter?.value ?? '');
    });
  }

  /** Whether the dialog is open. Setting it calls `show()` or `close()`. */
  get open(): boolean {
    return this.#dialog.state.open;
  }

  set open(open: boolean) {
    if (open) this.show();
    else this.close();
  }

  /** The value the dialog last closed with; cleared when it opens. */
  get returnValue(): string {
    return this.#dialog.state.returnValue;
  }

  /** Opens the dialog modally and clears `returnValue`. */
  show(): void {
    this.#dialog.state.show();
  }

  /** Closes the dialog. `returnValue` becomes the given value, or empty. */
  close(returnValue?: string): void {
    this.#dialog.state.close(returnValue);
  }

  override render() {
    return html`<dialog part="dialog" class="size-${sizeName(this.size)}" @close=${this.#onClose} @cancel=${this.#onCancel}>
      <header part="header">
        <h2 part="title"><slot name="heading">${this.label}</slot></h2>
        <mb-button part="close-button" variant="ghost" @click=${() => this.close()}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" fill="none" /></svg>
          <span class="visually-hidden">${this.closeLabel}</span>
        </mb-button>
      </header>
      <div part="body"><slot></slot></div>
      <footer part="footer" ?hidden=${!this.#hasFooter}>
        <slot name="footer" @slotchange=${this.#onFooterChange}></slot>
      </footer>
    </dialog>`;
  }

  #onClose(): void {
    this.dispatchEvent(new Event('close'));
  }

  #onCancel(event: Event): void {
    if (!this.dispatchEvent(new Event('cancel', { cancelable: true }))) event.preventDefault();
  }

  #onFooterChange(event: Event): void {
    this.#hasFooter = (event.target as HTMLSlotElement).assignedNodes({ flatten: true }).length > 0;
    this.requestUpdate();
  }
}
