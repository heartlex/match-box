import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

interface FieldArgs {
  label: string;
  description: string;
  error: string;
  size: string;
}

const args: FieldArgs = { label: 'Email', description: 'We never share it.', error: '', size: 'md' };

const meta: Meta<FieldArgs> = {
  title: 'Components/Field',
  component: 'mb-field',
  tags: ['autodocs'],
  args,
  // Only the args the render uses; Storybook would add a row for every manifest entry.
  parameters: { controls: { include: Object.keys(args) } },
  argTypes: {
    // `label`, `description`, and `error` are also parts and slots; without these Storybook offers a JSON editor.
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  render: (args) =>
    html`<mb-field label=${args.label} description=${args.description} error=${args.error} size=${args.size}
      ><mb-input type="email" required></mb-input
    ></mb-field>`,
};
export default meta;

type Story = StoryObj<FieldArgs>;
const showcase = { parameters: { controls: { disable: true } } };

export const Playground: Story = {};

export const Form: Story = {
  ...showcase,
  render: () => {
    const submit = (event: SubmitEvent): void => {
      event.preventDefault();
      const form = event.target as HTMLFormElement;
      const output = form.querySelector('output') as HTMLOutputElement;
      output.value = JSON.stringify(Object.fromEntries([...new FormData(form).keys()].map((key) => [key, new FormData(form).getAll(key)])));
    };
    return html`<form @submit=${submit} style="display: grid; gap: 1rem; max-inline-size: 24rem;">
      <mb-field label="Email" description="We never share it."><mb-input type="email" name="email" required></mb-input></mb-field>
      <mb-field label="Toppings" description="Pick at least one.">
        <mb-checkbox-group name="topping" required select-all>
          <mb-checkbox value="nuts">Nuts</mb-checkbox>
          <mb-checkbox value="honey">Honey</mb-checkbox>
          <mb-checkbox value="seeds">Seeds</mb-checkbox>
        </mb-checkbox-group>
      </mb-field>
      <mb-field label="Notifications"><mb-switch name="notify">Email me about updates</mb-switch></mb-field>
      <mb-field><mb-checkbox name="terms" required>I accept the terms</mb-checkbox></mb-field>
      <div style="display: flex; gap: 0.5rem;">
        <mb-button type="submit" color="primary">Send</mb-button>
        <mb-button type="reset" variant="ghost">Reset</mb-button>
      </div>
      <output></output>
    </form>`;
  },
};
