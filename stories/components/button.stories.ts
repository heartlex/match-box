import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface ButtonArgs {
  label: string;
  variant: string;
  color: string;
  size: string;
  href: string;
  disabled: boolean;
}

const colors = ['neutral', 'primary', 'secondary', 'tertiary', 'danger'];

const meta: Meta<ButtonArgs> = {
  title: 'Components/Button',
  component: 'mb-button',
  tags: ['autodocs'],
  args: { label: 'Button', variant: 'default', color: 'neutral', size: 'md', href: '', disabled: false },
  argTypes: {
    label: { control: 'text', description: 'Default slot content' },
    variant: { control: 'select', options: ['default', 'outline', 'ghost'] },
    color: { control: 'select', options: colors },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    href: { control: 'text' },
  },
  render: (args) =>
    html`<mb-button
      variant=${args.variant}
      color=${args.color}
      size=${args.size}
      href=${ifDefined(args.href || undefined)}
      ?disabled=${args.disabled}
      >${args.label}</mb-button
    >`,
};
export default meta;

type Story = StoryObj<ButtonArgs>;
const showcase = { parameters: { controls: { disable: true } } };
const row = 'display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;';

export const Playground: Story = {};

export const Variants: Story = {
  ...showcase,
  render: () =>
    html`<div style=${row}>
      <mb-button color="primary">Default</mb-button>
      <mb-button variant="outline" color="primary">Outline</mb-button>
      <mb-button variant="ghost" color="primary">Ghost</mb-button>
    </div>`,
};

export const Colors: Story = {
  ...showcase,
  render: () => html`<div style=${row}>${colors.map((color) => html`<mb-button color=${color}>${color}</mb-button>`)}</div>`,
};

export const Sizes: Story = {
  ...showcase,
  render: () =>
    html`<div style=${row}>
      <mb-button size="sm" color="primary">Small</mb-button>
      <mb-button color="primary">Medium</mb-button>
      <mb-button size="lg" color="primary">Large</mb-button>
    </div>`,
};

export const Link: Story = {
  ...showcase,
  render: () =>
    html`<div style=${row}>
      <mb-button href="#" variant="outline">Link</mb-button>
      <mb-button href="#" disabled>Disabled link</mb-button>
    </div>`,
};

export const Disabled: Story = {
  ...showcase,
  render: () => html`<mb-button disabled>Disabled</mb-button>`,
};
