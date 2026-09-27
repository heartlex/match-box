import { css } from 'lit';
import { focusRing, hostStyles } from '../shared/styles.ts';

export const optionStyles = [
  hostStyles,
  css`
    :host {
      display: block;
      outline: none;
    }

    [part='base'] {
      display: flex;
      align-items: center;
      gap: var(--mb-option-gap, var(--mb-space-inline-sm));
      padding-block: var(--mb-option-padding-block, var(--mb-space-stack-sm));
      padding-inline: var(--mb-option-padding-inline, var(--mb-space-inline-sm));
      border-radius: var(--mb-option-radius, var(--mb-radius-control));
      color: var(--mb-option-fg, var(--mb-color-fg-default));
      cursor: pointer;
      user-select: none;
    }

    :host(:hover) [part='base'] {
      background: var(--mb-option-bg-hover, var(--mb-color-neutral-subtle));
    }

    :host([aria-selected='true']) [part='base'] {
      background: var(--mb-option-bg-selected, var(--_subtle, var(--mb-color-neutral-subtle)));
      color: var(--mb-option-fg-selected, var(--_text, var(--mb-color-neutral-text)));
    }

    :host(:focus-visible) [part='base'] {
      ${focusRing}
    }

    :host([aria-disabled='true']) [part='base'] {
      background: none;
      color: var(--mb-color-fg-disabled);
      cursor: not-allowed;
    }

    [part='check'] {
      display: var(--_check-display, none);
      position: relative;
      flex: none;
      inline-size: 1rem;
      block-size: 1rem;
      border: 1px solid currentColor;
      border-radius: 2px;
    }

    :host([aria-selected='true']) [part='check']::after {
      content: '';
      position: absolute;
      inset-block-start: 1px;
      inset-inline-start: 4px;
      inline-size: 5px;
      block-size: 9px;
      border-inline-end: 2px solid currentColor;
      border-block-end: 2px solid currentColor;
      transform: rotate(45deg);
    }

    [part='prefix'],
    [part='suffix'] {
      display: inline-flex;
    }

    [part='label'] {
      flex: 1;
    }

    @media (forced-colors: active) {
      :host([aria-selected='true']) [part='base'] {
        background: Highlight;
        color: HighlightText;
      }

      :host([aria-disabled='true']) [part='base'] {
        color: GrayText;
      }
    }
  `,
];
