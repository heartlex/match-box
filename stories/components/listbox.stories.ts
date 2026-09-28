import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface ListboxArgs {
  label: string;
  multiple: boolean;
  color: string;
  size: string;
  disabled: boolean;
}

const meta: Meta<ListboxArgs> = {
  title: 'Components/Listbox',
  component: 'mb-listbox',
  tags: ['autodocs'],
  args: { label: 'Fruit', multiple: false, color: 'neutral', size: 'md', disabled: false },
  argTypes: {
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
