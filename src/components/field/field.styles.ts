import { css } from 'lit';
import { hostStyles, sizeStyles } from '../shared/styles.ts';

export const fieldStyles = [
  hostStyles,
  sizeStyles,
  css`
    :host {
      display: block;
    }

    .base {
      display: grid;
      font-family: var(--mb-font-family-body);
      line-height: var(--mb-line-height-body);
      letter-spacing: normal;
    }

    /* Rows around the control carry their own gap: the error stays in the tree even when
       empty (a live region), and a container-wide grid gap would always add space for it. */
    .heading {
      display: flex;
      gap: 0.125rem;
      margin-block-end: var(--mb-field-gap, var(--mb-space-1));
    }

    [part='label'],
    [part='required'] {
      font-size: var(--mb-field-label-font-size, var(--mb-font-size-label));
      font-weight: var(--mb-font-weight-medium);
    }

    [part='label'] {
      color: var(--mb-field-label-color, var(--mb-color-fg-default));
    }

    [part='required'] {
      color: var(--mb-field-error-color, var(--mb-color-danger-text));
    }

    [part='description'],
    [part='error'] {
      font-size: var(--mb-font-size-small);
    }

    [part='description'] {
      margin-block-start: var(--mb-field-gap, var(--mb-space-1));
      color: var(--mb-field-description-color, var(--mb-color-fg-muted));
    }

    [part='control'] {
      display: grid;
    }

    [part='error'].has-error {
      display: flex;
      align-items: center;
      gap: var(--mb-space-1);
      margin-block-start: var(--mb-field-gap, var(--mb-space-1));
      padding: var(--mb-space-1) var(--mb-space-2);
      border-radius: var(--mb-radius-control);
      background: var(--mb-field-error-bg, var(--mb-color-bg-danger));
      color: var(--mb-field-error-color, var(--mb-color-fg-danger));
    }

    [part='error-icon'] {
      flex: none;
      inline-size: 0.75rem;
      block-size: 0.75rem;
      fill: var(--mb-field-error-icon-color, var(--mb-color-danger-border));
    }

    @media (forced-colors: active) {
      [part='error'].has-error {
        border: 1px solid CanvasText;
      }

      [part='error-icon'] {
        fill: CanvasText;
      }
    }
  `,
];
