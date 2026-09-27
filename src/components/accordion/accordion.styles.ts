import { css } from 'lit';
import { hostStyles } from '../shared/styles.ts';

export const accordionStyles = [
  hostStyles,
  css`
    :host {
      display: block;
    }

    [part='base'] {
      border-block-start: 1px solid var(--mb-accordion-border-color, var(--mb-color-border-default));
    }
  `,
];
