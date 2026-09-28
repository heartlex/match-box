import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { mountDisclosure } from '../../site/demos/demos.js';

const meta: Meta = { title: 'Patterns/Disclosure', parameters: { controls: { disable: true } } };
export default meta;

export const Disclosure: StoryObj = {
  render: () => {
    const container = document.createElement('div');
    mountDisclosure(container);
    return container;
  },
};
