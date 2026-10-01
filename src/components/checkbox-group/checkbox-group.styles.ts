import { css } from 'lit';
import { visuallyHidden } from '../shared/field-control.ts';
import { hostStyles } from '../shared/styles.ts';

export const checkboxGroupStyles = [
  hostStyles,
  visuallyHidden,
  css`
    :host {
      display: block;
    }

    [part='group'] {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--mb-checkbox-group-gap, var(--mb-space-3));
    }
  `,
];
