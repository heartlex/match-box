import { LitElement, html } from 'lit';
import { DelegatesFocus, FormAssociated } from '../../src/lit/index.ts';

/** A text field built from both mixins, rendering one inner input. */
export class TestField extends FormAssociated(DelegatesFocus(LitElement)) {
  override render() {
    return html`<input
      aria-label="Field"
      .value=${this.value}
      @input=${(event: Event) => {
        this.value = (event.target as HTMLInputElement).value;
      }}
    />`;
  }
}
customElements.define('test-field', TestField);
