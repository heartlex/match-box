import { LitElement, html } from 'lit';
import { DialogController, DisclosureController, ListboxController } from '../../src/lit/index.ts';
import type { ListboxOptionSpec } from '../../src/core/testing/index.ts';

/** Minimal, unpublished Lit implementations used by the browser tests. */

export class TestDisclosure extends LitElement {
  readonly disclosure = new DisclosureController(this, () => ({
    trigger: this.renderRoot.querySelector('button') as HTMLElement,
    panel: this.renderRoot.querySelector('div') as HTMLElement,
  }));

  override render() {
    return html`<button type="button">Details</button>
      <div ?hidden=${!this.disclosure.state.expanded}>Hidden content</div>`;
  }
}
customElements.define('test-disclosure', TestDisclosure);

export class TestDialog extends LitElement {
  readonly dialog = new DialogController(this, () => ({
    dialog: this.renderRoot.querySelector('dialog') as HTMLDialogElement,
    title: this.renderRoot.querySelector('h2') as HTMLElement,
  }));

  override render() {
    return html`<button type="button" @click=${() => this.dialog.state.show()}>Open</button>
      <dialog>
        <h2>Confirm order</h2>
        <form method="dialog"><button value="confirm">Confirm</button></form>
      </dialog>`;
  }
}
customElements.define('test-dialog', TestDialog);

export class TestListbox extends LitElement {
  static override properties = {
    multiple: { type: Boolean },
    options: { attribute: false },
  };

  declare multiple: boolean;
  declare options: readonly ListboxOptionSpec[];
  // Created on first connect, once `multiple` has its final value.
  listbox: ListboxController | undefined;

  constructor() {
    super();
    this.multiple = false;
    this.options = [];
  }

  override connectedCallback(): void {
    this.listbox ??= new ListboxController(
      this,
      () => ({
        root: this.renderRoot.querySelector('[part=listbox]') as HTMLElement,
        label: this.renderRoot.querySelector('[part=label]') as HTMLElement,
        items: () => [...this.renderRoot.querySelectorAll<HTMLElement>('[part=option]')],
      }),
      { multiple: this.multiple },
    );
    super.connectedCallback();
  }

  override render() {
    return html`<span part="label">Fruit</span>
      <div part="listbox">
        ${this.options.map(
          (option) => html`<div part="option" ?data-disabled=${option.disabled ?? false}>${option.label}</div>`,
        )}
      </div>`;
  }
}
customElements.define('test-listbox', TestListbox);
