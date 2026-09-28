import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface DisclosureArgs {
  summary: string;
  content: string;
  open: boolean;
  color: string;
  size: string;
}

const meta: Meta<DisclosureArgs> = {
  title: 'Components/Disclosure',
  component: 'mb-disclosure',
  tags: ['autodocs'],
  args: {
    summary: 'Shipping details',
    content: 'Orders ship within two business days.',
    open: false,
    color: 'neutral',
    size: 'md',
  },
  argTypes: {
    summary: { control: 'text', description: 'The `summary` slot' },
    content: { control: 'text', description: 'Default slot content' },
    color: { control: 'select', options: ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) =>
    html`<mb-disclosure ?open=${args.open} color=${args.color} size=${args.size}>
      <span slot="summary">${args.summary}</span>${args.content}
    </mb-disclosure>`,
};
export default meta;

type Story = StoryObj<DisclosureArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const Open: Story = { ...showcase, args: { open: true } };

export const Sizes: Story = {
  ...showcase,
  render: () =>
    html`${['sm', 'md', 'lg'].map(
      (size) =>
        html`<mb-disclosure size=${size}><span slot="summary">Size ${size}</span>A ${size} disclosure.</mb-disclosure>`,
    )}`,
};
