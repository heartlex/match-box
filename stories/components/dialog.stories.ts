import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface DialogArgs {
  label: string;
  color: string;
  size: string;
  persistent: boolean;
  closeLabel: string;
}

// Dialogs open from a trigger, never on load, so a docs page does not fill with modals.
const openNext = (event: Event): void => {
  ((event.currentTarget as Element).nextElementSibling as HTMLElement & { show(): void }).show();
};

const dialog = (args: DialogArgs, trigger: string) =>
  html`<mb-button color=${args.color} @click=${openNext}>${trigger}</mb-button>
    <mb-dialog
      label=${args.label}
      size=${args.size}
      ?persistent=${args.persistent}
      close-label=${args.closeLabel}
    >
      <p>This removes the project and its history.</p>
      <form method="dialog" slot="footer">
        <mb-button type="submit" variant="ghost">Cancel</mb-button>
        <mb-button type="submit" color=${args.color} value="delete">Delete</mb-button>
      </form>
    </mb-dialog>`;

const args: DialogArgs = {
  label: 'Delete project?',
  color: 'danger',
  size: 'md',
  persistent: false,
  closeLabel: 'Close',
};

const meta: Meta<DialogArgs> = {
  title: 'Components/Dialog',
  component: 'mb-dialog',
  tags: ['autodocs'],
  args,
  // Only the args the render uses; Storybook would add a row for every manifest entry.
  parameters: { controls: { include: Object.keys(args) } },
  argTypes: {
    // `label` is also a shadow part; without this Storybook offers a JSON editor.
    label: { control: 'text', description: 'Accessible name and visible title' },
    closeLabel: { control: 'text', description: 'The `close-label` attribute' },
    color: { control: 'select', options: ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) => dialog(args, 'Delete project'),
};
export default meta;

type Story = StoryObj<DialogArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const Trigger: Story = { ...showcase };

export const Sizes: Story = {
  ...showcase,
  render: (args) =>
    html`<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
      ${['sm', 'md', 'lg'].map((size) => html`<div>${dialog({ ...args, size }, `Open ${size}`)}</div>`)}
    </div>`,
};
