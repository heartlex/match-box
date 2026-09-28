import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface ListboxArgs {
  label: string;
  multiple: boolean;
  color: string;
  size: string;
  disabled: boolean;
  required: boolean;
}

const args: ListboxArgs = { label: 'Fruit', multiple: false, color: 'neutral', size: 'md', disabled: false, required: false };

const meta: Meta<ListboxArgs> = {
  title: 'Components/Listbox',
  component: 'mb-listbox',
  tags: ['autodocs'],
  args,
  // Only the args the render uses; Storybook would add a row for every manifest entry.
  parameters: { controls: { include: Object.keys(args) } },
  argTypes: {
    // `label` is also a shadow part; without this Storybook offers a JSON editor.
    label: { control: 'text', description: 'Accessible name' },
    color: { control: 'select', options: ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) =>
    html`<mb-listbox
      label=${args.label}
      ?multiple=${args.multiple}
      color=${args.color}
      size=${args.size}
      ?disabled=${args.disabled}
      ?required=${args.required}
    >
      <mb-option>Apple</mb-option>
      <mb-option selected>Banana</mb-option>
      <mb-option>Cherry</mb-option>
      <mb-option>Date</mb-option>
    </mb-listbox>`,
};
export default meta;

type Story = StoryObj<ListboxArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const Single: Story = { ...showcase };

export const Multiple: Story = {
  ...showcase,
  render: () =>
    html`<mb-listbox label="Toppings" multiple color="tertiary">
      <mb-option value="nuts">Nuts</mb-option>
      <mb-option value="honey" selected>Honey</mb-option>
      <mb-option value="yogurt" selected>Yogurt</mb-option>
    </mb-listbox>`,
};

export const DisabledOptions: Story = {
  ...showcase,
  render: () =>
    html`<mb-listbox label="Fruit" color="primary">
      <mb-option>Apple</mb-option>
      <mb-option disabled>Banana</mb-option>
      <mb-option disabled>Cherry</mb-option>
      <mb-option>Date</mb-option>
    </mb-listbox>`,
};

export const Sizes: Story = {
  ...showcase,
  render: () =>
    html`<div style="display: flex; flex-wrap: wrap; align-items: start; gap: 1rem;">
      ${['sm', 'md', 'lg'].map(
        (size) =>
          html`<mb-listbox label="Size ${size}" size=${size}>
            <mb-option>Apple</mb-option>
            <mb-option selected>Banana</mb-option>
          </mb-listbox>`,
      )}
    </div>`,
};
