import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface SwitchArgs {
  label: string;
  checked: boolean;
  disabled: boolean;
  color: string;
  size: string;
}

const args: SwitchArgs = { label: 'Email me about updates', checked: false, disabled: false, color: 'primary', size: 'md' };

const meta: Meta<SwitchArgs> = {
  title: 'Components/Switch',
  component: 'mb-switch',
  tags: ['autodocs'],
  args,
  // Only the args the render uses; Storybook would add a row for every manifest entry.
  parameters: { controls: { include: Object.keys(args) } },
  argTypes: {
    // `label` is also a part; without this Storybook offers a JSON editor.
    label: { control: 'text', description: 'Default slot content' },
    color: { control: 'select', options: ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) =>
    html`<mb-switch ?checked=${args.checked} ?disabled=${args.disabled} color=${args.color} size=${args.size}
      >${args.label}</mb-switch
    >`,
};
export default meta;

type Story = StoryObj<SwitchArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const Sizes: Story = {
  ...showcase,
  render: () =>
    html`<div style="display: grid; gap: 0.5rem;">
      ${['sm', 'md', 'lg'].map((size) => html`<mb-switch size=${size} checked color="primary">Size ${size}</mb-switch>`)}
    </div>`,
};
