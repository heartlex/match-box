import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { mountCheckboxGroup } from '../../site/demos/demos.js';

const meta: Meta = { title: 'Patterns/CheckboxGroup', parameters: { controls: { disable: true } } };
export default meta;

export const CheckboxGroup: StoryObj = {
  render: () => {
    const container = document.createElement('div');
    mountCheckboxGroup(container);
    return container;
  },
};
