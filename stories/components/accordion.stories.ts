import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface AccordionArgs {
  multiple: boolean;
  size: string;
}

const meta: Meta<AccordionArgs> = {
  title: 'Components/Accordion',
  component: 'mb-accordion',
  tags: ['autodocs'],
  args: { multiple: false, size: 'md' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] } },
  render: (args) =>
    html`<mb-accordion ?multiple=${args.multiple} size=${args.size}>
      <mb-disclosure><span slot="summary">Shipping</span>Orders ship within two business days.</mb-disclosure>
      <mb-disclosure><span slot="summary">Returns</span>Return any item within 30 days.</mb-disclosure>
      <mb-disclosure><span slot="summary">Warranty</span>Two years on all hardware.</mb-disclosure>
    </mb-accordion>`,
};
export default meta;

type Story = StoryObj<AccordionArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const Single: Story = { ...showcase };

export const Multiple: Story = { ...showcase, args: { multiple: true } };

export const Sized: Story = { ...showcase, args: { size: 'sm' } };
