import { html } from 'lit';
import type { Meta, StoryObj } from '@storybook/web-components-vite';

// Built only with STORYBOOK_SMOKE_FIXTURE=1. Each story must make the smoke test fail.
const meta: Meta = { title: 'Smoke fixture' };
export default meta;

export const Throws: StoryObj = {
  render: () => {
    throw new Error('smoke fixture: render throws');
  },
};

export const LogsError: StoryObj = {
  render: () => {
    console.error('smoke fixture: logs an error');
    return html`<p>Logged an error.</p>`;
  },
};

export const AxeViolation: StoryObj = {
  render: () => html`<button></button>`,
};

export const Empty: StoryObj = {
  render: () => html``,
};

export const UndefinedElement: StoryObj = {
  render: () => html`<mb-nonexistent>Never registered</mb-nonexistent>`,
};
