import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { mountListbox } from '../../site/demos/demos.js';

// The plain-HTML demo the conformance suite runs (test/browser/demos.test.ts), styled just enough to see state.
const meta: Meta = { title: 'Patterns/Listbox', parameters: { controls: { disable: true } } };
export default meta;

const styles = html`<style>
  .pattern [role='listbox'] { display: grid; gap: 2px; max-inline-size: 12rem; margin-block-start: 0.5rem; }
  .pattern [role='option'] { padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
  .pattern [role='option'][aria-selected='true'] { background: var(--mb-color-primary-subtle); color: var(--mb-color-primary-text); }
  .pattern [role='option'][aria-disabled='true'] { color: var(--mb-color-fg-disabled); }
  .pattern :focus-visible { outline: var(--mb-focus-ring-width) solid var(--mb-color-border-focus); }
</style>`;

export const Listbox: StoryObj = {
  render: () => {
    const container = document.createElement('div');
    container.className = 'pattern';
    mountListbox(container, {
      multiple: false,
      options: [{ label: 'Apple' }, { label: 'Banana' }, { label: 'Cherry', disabled: true }, { label: 'Date' }],
    });
    return html`${styles}${container}`;
  },
};
