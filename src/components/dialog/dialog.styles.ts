import { css } from 'lit';
import { hostStyles } from '../shared/styles.ts';

export const dialogStyles = [
  hostStyles,
  css`
    :host {
      display: block;
    }

    [part='dialog'] {
      max-width: none;
      inline-size: min(var(--mb-dialog-width, var(--_width)), calc(100vw - 2 * var(--mb-space-inline-lg)));
      max-block-size: calc(100dvh - 2 * var(--mb-space-stack-lg));
      padding: 0;
      border: 1px solid var(--mb-dialog-border-color, var(--mb-color-border-default));
      border-radius: var(--mb-dialog-radius, var(--mb-radius-surface));
      background: var(--mb-dialog-bg, var(--mb-color-bg-surface-raised));
      color: var(--mb-color-fg-default);
      box-shadow: var(--mb-dialog-shadow, var(--mb-shadow-overlay));
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-font-size-body);
      line-height: var(--mb-line-height-body);
      transition-property: opacity, transform, overlay, display;
      transition-duration: var(--mb-dialog-duration, var(--mb-motion-duration-slow));
      transition-timing-function: var(--mb-motion-easing-exit);
      transition-behavior: allow-discrete;
    }

    [part='dialog'].size-sm {
      --_width: var(--mb-dialog-width-sm);
    }

    [part='dialog'].size-md {
      --_width: var(--mb-dialog-width-md);
    }

    [part='dialog'].size-lg {
      --_width: var(--mb-dialog-width-lg);
    }

    [part='dialog'][open] {
      transition-timing-function: var(--mb-motion-easing-spring);
    }

    [part='dialog']:not([open]) {
      opacity: 0;
      transform: scale(0.96);
    }

    @starting-style {
      [part='dialog'][open] {
        opacity: 0;
        transform: scale(0.96);
      }
    }

    [part='dialog']::backdrop {
      background: transparent;
      backdrop-filter: blur(0);
      transition-property: background-color, backdrop-filter, overlay, display;
      transition-duration: var(--mb-dialog-duration, var(--mb-motion-duration-medium));
      transition-timing-function: var(--mb-motion-easing-standard);
      transition-behavior: allow-discrete;
    }

    [part='dialog'][open]::backdrop {
      background: var(--mb-dialog-backdrop, rgb(14 14 48 / 0.4));
      backdrop-filter: blur(var(--mb-dialog-backdrop-blur, 2px));
    }

    @starting-style {
      [part='dialog'][open]::backdrop {
        background: transparent;
        backdrop-filter: blur(0);
      }
    }

    [part='header'] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--mb-space-inline-md);
      padding: var(--mb-space-6) var(--mb-space-6) 0;
    }

    [part='title'] {
      margin: 0;
      font-size: var(--mb-dialog-title-font-size, var(--mb-font-size-subtitle));
      font-weight: var(--mb-font-weight-strong);
      line-height: var(--mb-line-height-heading);
      letter-spacing: normal;
    }

    [part='body'] {
      padding: var(--mb-space-2) var(--mb-space-6);
      color: var(--mb-color-fg-muted);
    }

    [part='footer'] {
      display: flex;
      justify-content: flex-end;
      gap: var(--mb-space-inline-sm);
      padding: var(--mb-space-4) var(--mb-space-6) var(--mb-space-6);
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
