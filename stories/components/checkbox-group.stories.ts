import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface GroupArgs {
  selectAll: boolean;
  required: boolean;
  disabled: boolean;
  color: string;
  size: string;
}

const args: GroupArgs = { selectAll: true, required: false, disabled: false, color: 'primary', size: 'md' };

const meta: Meta<GroupArgs> = {
  title: 'Components/CheckboxGroup',
  component: 'mb-checkbox-group',
  tags: ['autodocs'],
  args,
  // Only the args the render uses; Storybook would add a row for every manifest entry.
  parameters: { controls: { include: Object.keys(args) } },
  argTypes: {
    selectAll: { control: 'boolean', description: 'The `select-all` attribute' },
    color: { control: 'select', options: ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) =>
    html`<mb-field label="Toppings" description="Pick at least one.">
      <mb-checkbox-group
        ?select-all=${args.selectAll}
        ?required=${args.required}
        ?disabled=${args.disabled}
        color=${args.color}
        size=${args.size}
      >
        <mb-checkbox value="nuts">Nuts</mb-checkbox>
        <mb-checkbox value="honey" checked>Honey</mb-checkbox>
        <mb-checkbox value="yogurt" disabled>Yogurt</mb-checkbox>
        <mb-checkbox value="seeds">Seeds</mb-checkbox>
      </mb-checkbox-group>
    </mb-field>`,
};
export default meta;

export const Playground: StoryObj<GroupArgs> = {};
