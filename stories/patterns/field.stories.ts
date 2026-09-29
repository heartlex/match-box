import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { mountField } from '../../site/demos/demos.js';

const meta: Meta = { title: 'Patterns/Field', parameters: { controls: { disable: true } } };
export default meta;

export const Field: StoryObj = {
  render: () => {
    const container = document.createElement('div');
    mountField(container);
    return container;
  },
};
