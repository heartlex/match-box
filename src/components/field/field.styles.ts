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
      gap: var(--mb-field-gap, var(--mb-space-2));
      font-family: var(--mb-font-family-body);
    }

    .heading {
      display: flex;
      gap: 0.125rem;
    }

    [part='label'] {
      color: var(--mb-field-label-color, var(--mb-color-fg-default));
      font-size: var(--mb-field-label-font-size, var(--_font-size));
      font-weight: var(--mb-font-weight-strong);
    }

    [part='required'],
    [part='error'] {
      color: var(--mb-field-error-color, var(--mb-color-danger-text));
    }

    [part='description'],
    [part='error'] {
      font-size: var(--mb-font-size-small);
    }

    [part='description'] {
      color: var(--mb-field-description-color, var(--mb-color-fg-muted));
    }

    [part='control'] {
      display: grid;
    }
  `,
];
