import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface DisclosureArgs {
  summary: string;
  content: string;
  open: boolean;
  color: string;
  size: string;
  headingLevel: number;
}

const args: DisclosureArgs = {
  summary: 'Shipping details',
  content: 'Orders ship within two business days.',
  open: false,
  color: 'neutral',
  size: 'md',
  headingLevel: 3,
};

const meta: Meta<DisclosureArgs> = {
  title: 'Components/Disclosure',
  component: 'mb-disclosure',
  tags: ['autodocs'],
  args,
  // Only the args the render uses; Storybook would add a row for every manifest entry.
  parameters: { controls: { include: Object.keys(args) } },
  argTypes: {
    summary: { control: 'text', description: 'The `summary` slot' },
    content: { control: 'text', description: 'Default slot content' },
    color: { control: 'select', options: ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    headingLevel: { control: { type: 'range', min: 1, max: 6 }, description: 'The `heading-level` attribute' },
  },
  render: (args) =>
    html`<mb-disclosure
      ?open=${args.open}
      color=${args.color}
      size=${args.size}
      heading-level=${args.headingLevel}
    >
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
