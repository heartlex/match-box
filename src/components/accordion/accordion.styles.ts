import { css } from 'lit';
import { hostStyles } from '../shared/styles.ts';

export const accordionStyles = [
  hostStyles,
  css`
    :host {
      display: block;
    }

    [part='base'] {
      /* Keeps the trigger's focus ring inside the clip. */
      --_focus-offset: calc(-1 * var(--mb-focus-ring-width));
      overflow: hidden;
      border: 1px solid var(--mb-accordion-border-color, var(--mb-color-border-default));
      border-radius: var(--mb-accordion-radius, var(--mb-radius-surface));
    }

    /* The container draws the bottom edge; the last item's own divider would double it. */
    ::slotted(:last-child) {
      --mb-disclosure-border-color: transparent;
    }
  `,
];
