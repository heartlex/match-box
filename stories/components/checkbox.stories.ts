import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface CheckboxArgs {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  color: string;
  size: string;
}

const args: CheckboxArgs = { label: 'I accept the terms', checked: false, indeterminate: false, disabled: false, color: 'primary', size: 'md' };

const meta: Meta<CheckboxArgs> = {
  title: 'Components/Checkbox',
  component: 'mb-checkbox',
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
    html`<mb-checkbox
      ?checked=${args.checked}
      ?indeterminate=${args.indeterminate}
      ?disabled=${args.disabled}
      color=${args.color}
      size=${args.size}
      >${args.label}</mb-checkbox
    >`,
};
export default meta;

type Story = StoryObj<CheckboxArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const States: Story = {
  ...showcase,
  render: () =>
    html`<div style="display: grid; gap: 0.5rem;">
      <mb-checkbox>Unchecked</mb-checkbox>
      <mb-checkbox checked color="primary">Checked</mb-checkbox>
      <mb-checkbox indeterminate color="primary">Indeterminate</mb-checkbox>
      <mb-checkbox disabled>Disabled</mb-checkbox>
    </div>`,
};

export const Sizes: Story = {
  ...showcase,
  render: () =>
    html`<div style="display: grid; gap: 0.5rem;">
      ${['sm', 'md', 'lg'].map((size) => html`<mb-checkbox size=${size} checked color="primary">Size ${size}</mb-checkbox>`)}
    </div>`,
};
