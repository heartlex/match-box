import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface InputArgs {
  type: string;
  placeholder: string;
  required: boolean;
  disabled: boolean;
  color: string;
  size: string;
}

const args: InputArgs = { type: 'text', placeholder: 'Type here', required: false, disabled: false, color: 'neutral', size: 'md' };

const meta: Meta<InputArgs> = {
  title: 'Components/Input',
  component: 'mb-input',
  tags: ['autodocs'],
  args,
  // Only the args the render uses; Storybook would add a row for every manifest entry.
  parameters: { controls: { include: Object.keys(args) } },
  argTypes: {
    type: { control: 'select', options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number'] },
    color: { control: 'select', options: ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) =>
    html`<mb-field label="Your answer"
      ><mb-input
        type=${args.type}
        placeholder=${args.placeholder}
        ?required=${args.required}
        ?disabled=${args.disabled}
        color=${args.color}
        size=${args.size}
      ></mb-input
    ></mb-field>`,
};
export default meta;

type Story = StoryObj<InputArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const Sizes: Story = {
  ...showcase,
  render: () =>
    html`<div style="display: grid; gap: 1rem; max-inline-size: 20rem;">
      ${['sm', 'md', 'lg'].map((size) => html`<mb-input size=${size} aria-label="Size ${size}" placeholder="Size ${size}"></mb-input>`)}
    </div>`,
};

export const PrefixAndSuffix: Story = {
  ...showcase,
  render: () =>
    html`<mb-field label="Price"><mb-input type="number" min="0"><span slot="suffix">€</span></mb-input></mb-field>`,
};
