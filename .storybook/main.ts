/// <reference types="node" />
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/web-components-vite';
import { mergeConfig } from 'vite';

// The fixtures exist only to prove the smoke test can fail (npm run storybook:smoke:self-test).
const fixtures = process.env['STORYBOOK_SMOKE_FIXTURE'] === '1' ? ['../stories/__smoke__/*.stories.ts'] : [];

const config: StorybookConfig = {
  framework: '@storybook/web-components-vite',
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  stories: [
    '../stories/*.mdx',
    '../stories/foundations/*.stories.ts',
    '../stories/components/*.stories.ts',
    '../stories/patterns/*.stories.ts',
    '../stories/motion/*.stories.ts',
    ...fixtures,
  ],
  // site/demos/demos.js imports the core by its package name; stories use the source.
  viteFinal: (vite) =>
    mergeConfig(vite, {
      resolve: { alias: { 'match-box/core': fileURLToPath(new URL('../src/core/index.ts', import.meta.url)) } },
    }),
};

export default config;
