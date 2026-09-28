import { html, nothing } from 'lit';
import { setCustomElementsManifest, type Preview } from '@storybook/web-components-vite';
import manifest from '../dist/custom-elements.json' with { type: 'json' };
import '../src/tokens/tokens.css';
import '../src/components/define/all.ts';

// The same manifest as the Eleventy API tables: attributes, slots, parts, events, and CSS properties.
setCustomElementsManifest(manifest);

// What tokens.css does under prefers-reduced-motion: reduce. A page cannot emulate the media query.
const noMotion = '--mb-motion-duration-fast: 0ms; --mb-motion-duration-medium: 0ms; --mb-motion-duration-slow: 0ms;';

const preview: Preview = {
  parameters: { layout: 'fullscreen', controls: { expanded: true } },
  globalTypes: {
    theme: {
      description: 'Color theme',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'system', title: 'System' },
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    motion: {
      description: 'Motion. Off sets every duration to 0ms, as under prefers-reduced-motion: reduce',
      toolbar: {
        title: 'Motion',
        icon: 'lightning',
        items: [
          { value: 'on', title: 'Motion on' },
          { value: 'off', title: 'Motion off' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'system', motion: 'on' },
  decorators: [
    (story, context) => {
      const theme = context.globals['theme'] as string | undefined;
      const motion = context.globals['motion'] as string | undefined;
      const style = [
        'box-sizing: border-box',
        'padding: 1rem',
        'background: var(--mb-color-bg-canvas)',
        'color: var(--mb-color-fg-default)',
        // A full-height canvas in the story view; docs pages stack stories, so they size to content.
        context.viewMode === 'docs' ? '' : 'min-height: 100vh',
      ].join('; ');
      return html`<div
        class="mb-story"
        data-theme=${theme === 'light' || theme === 'dark' ? theme : nothing}
        style="${style}; ${motion === 'off' ? noMotion : ''}"
      >
        ${story()}
      </div>`;
    },
  ],
};

export default preview;
