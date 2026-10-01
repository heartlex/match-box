import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

const roles = ['neutral', 'primary', 'secondary', 'tertiary', 'danger'];
const roleTokens = ['solid', 'solid-hover', 'solid-active', 'on-solid', 'text', 'subtle', 'subtle-active', 'border'];
const statuses = ['success', 'warning', 'danger'];
const type = [
  ['h1', '--mb-font-size-h1'],
  ['h2', '--mb-font-size-h2'],
  ['h3', '--mb-font-size-h3'],
  ['h4', '--mb-font-size-h4'],
  ['Subtitle', '--mb-font-size-subtitle'],
  ['Body', '--mb-font-size-body'],
  ['Small', '--mb-font-size-small'],
  ['Caption', '--mb-font-size-caption'],
];
const spaces = [1, 2, 3, 4, 6, 8, 10];

const swatch = (token: string) =>
  html`<div style="display: grid; gap: 4px; font: 12px/1.5 var(--mb-font-family-body); color: var(--mb-color-fg-muted)">
    <div style="block-size: 40px; border-radius: var(--mb-radius-control); border: 1px solid var(--mb-color-border-default); background: var(${token})"></div>
    <code>${token}</code>
  </div>`;

const meta: Meta = {
  title: 'Foundations',
  parameters: { layout: 'padded' },
};

export default meta;

export const Colors: StoryObj = {
  render: () => html`<div style="display: grid; gap: 24px">
    ${roles.map(
      (role) => html`<section>
        <h3 style="font: var(--mb-font-weight-medium) 14px/1.5 var(--mb-font-family-body); color: var(--mb-color-fg-default)">${role}</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px">
          ${roleTokens.map((name) => swatch(`--mb-color-${role}-${name}`))}
        </div>
      </section>`,
    )}
    <section>
      <h3 style="font: var(--mb-font-weight-medium) 14px/1.5 var(--mb-font-family-body); color: var(--mb-color-fg-default)">status</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px">
        ${statuses.flatMap((status) => [swatch(`--mb-color-fg-${status}`), swatch(`--mb-color-bg-${status}`)])}
      </div>
    </section>
  </div>`,
};

export const Typography: StoryObj = {
  render: () => html`<div style="display: grid; gap: 16px; color: var(--mb-color-fg-default); font-family: var(--mb-font-family-body)">
    ${type.map(
      ([name, token]) => html`<div style="display: grid; grid-template-columns: 120px 1fr; align-items: baseline; gap: 16px">
        <code style="font-size: 12px; color: var(--mb-color-fg-muted)">${name}</code>
        <span style="font-size: var(${token}); font-weight: var(--mb-font-weight-strong); line-height: var(--mb-line-height-heading); letter-spacing: var(--mb-letter-spacing-heading)"
          >Cardiac rehab</span
        >
      </div>`,
    )}
  </div>`,
};

export const Spacing: StoryObj = {
  render: () => html`<div style="display: grid; gap: 12px; font: 12px/1.5 var(--mb-font-family-body); color: var(--mb-color-fg-muted)">
    ${spaces.map(
      (step) => html`<div style="display: grid; grid-template-columns: 120px 1fr; align-items: center; gap: 16px">
        <code>--mb-space-${step}</code>
        <div style="block-size: var(--mb-space-${step}); inline-size: 100%; background: var(--mb-color-primary-subtle-active)"></div>
      </div>`,
    )}
  </div>`,
};
