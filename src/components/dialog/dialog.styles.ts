import { css } from 'lit';
import { colorRoleStyles, hostStyles } from '../shared/styles.ts';

export const dialogStyles = [
  hostStyles,
  colorRoleStyles,
  css`
    :host {
      display: block;
    }

    [part='dialog'] {
      inline-size: min(var(--mb-dialog-width, 32rem), calc(100vw - 2 * var(--mb-space-inline-lg)));
      max-block-size: calc(100dvh - 2 * var(--mb-space-stack-lg));
      padding: 0;
      border: 1px solid var(--mb-dialog-border-color, var(--mb-color-border-default));
      border-block-start: var(--mb-dialog-accent-width, 4px) solid var(--mb-dialog-accent-color, var(--_solid));
      border-radius: var(--mb-dialog-radius, var(--mb-radius-surface));
      background: var(--mb-dialog-bg, var(--mb-color-bg-surface-raised));
      color: var(--mb-color-fg-default);
      box-shadow: var(--mb-dialog-shadow, var(--mb-shadow-overlay));
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-font-size-body);
      line-height: var(--mb-line-height-body);
    }

    [part='dialog'].color-neutral {
      border-block-start-width: var(--mb-dialog-accent-width, 1px);
      border-block-start-color: var(--mb-dialog-accent-color, var(--mb-dialog-border-color, var(--mb-color-border-default)));
    }

    [part='dialog']::backdrop {
      background: var(--mb-dialog-backdrop, rgb(0 0 0 / 0.4));
    }

    [part='header'] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--mb-space-inline-md);
      padding: var(--mb-space-stack-lg) var(--mb-space-inline-lg) 0;
    }

    [part='title'] {
      margin: 0;
      font-size: var(--mb-dialog-title-font-size, 1.25rem);
      font-weight: var(--mb-font-weight-strong);
    }

    [part='body'] {
      padding: var(--mb-space-stack-md) var(--mb-space-inline-lg);
    }

    [part='footer'] {
      display: flex;
      justify-content: flex-end;
      gap: var(--mb-space-inline-sm);
      padding: 0 var(--mb-space-inline-lg) var(--mb-space-stack-lg);
    }

    [part='close-button'] {
      --mb-button-padding-inline: var(--mb-space-inline-sm);
    }

    .visually-hidden {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    svg {
      inline-size: 1rem;
      block-size: 1rem;
    }

    @media (forced-colors: active) {
      [part='dialog'] {
        border-color: CanvasText;
      }
    }
  `,
];
