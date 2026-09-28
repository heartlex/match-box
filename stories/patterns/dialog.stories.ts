import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { mountDialog } from '../../site/demos/demos.js';

const meta: Meta = { title: 'Patterns/Dialog', parameters: { controls: { disable: true } } };
export default meta;

export const Dialog: StoryObj = {
  render: () => {
    const container = document.createElement('div');
    mountDialog(container);
    return container;
  },
};
