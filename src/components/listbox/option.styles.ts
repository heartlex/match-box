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
      gap: var(--mb-option-gap, var(--_gap, var(--mb-space-inline-sm)));
      min-block-size: var(--mb-option-height, var(--_height, 2.5rem));
      padding-block: var(--mb-option-padding-block, 0);
      padding-inline: var(--mb-option-padding-inline, var(--_padding-inline, var(--mb-space-3)));
      border-radius: var(--mb-option-radius, var(--mb-radius-control));
      color: var(--mb-option-fg, var(--mb-color-fg-default));
      font-size: var(--mb-option-font-size, var(--_font-size, 1em));
      line-height: var(--mb-line-height-body);
      letter-spacing: normal;
      cursor: pointer;
      user-select: none;
      transition-property: background-color, color;
      transition-duration: var(--mb-motion-duration-fast);
      transition-timing-function: var(--mb-motion-easing-standard);
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
      inline-size: var(--mb-option-icon-size, var(--_icon, 1.125rem));
      block-size: var(--mb-option-icon-size, var(--_icon, 1.125rem));
      border: var(--mb-border-width-control) solid var(--mb-color-border-strong);
      border-radius: var(--mb-radius-2);
      background: var(--mb-color-bg-surface);
    }

    :host([aria-selected='true']) [part='check'] {
      border-color: var(--_solid, var(--mb-color-primary-solid));
      background: var(--_solid, var(--mb-color-primary-solid));
    }

    :host([aria-selected='true']) [part='check']::after {
      content: '';
      position: absolute;
      inset-block-start: 1px;
      inset-inline-start: 4.5px;
      inline-size: 4px;
      block-size: 9px;
      border-inline-end: 2px solid var(--_on-solid, var(--mb-color-primary-on-solid));
      border-block-end: 2px solid var(--_on-solid, var(--mb-color-primary-on-solid));
      transform: rotate(45deg);
      transition-property: opacity, transform;
      transition-duration: var(--mb-motion-duration-fast);
      transition-timing-function: var(--mb-motion-easing-enter);
    }

    @starting-style {
      :host([aria-selected='true']) [part='check']::after {
        opacity: 0;
        transform: rotate(45deg) scale(0.5);
      }
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

      [part='check'] {
        border-color: CanvasText;
      }
    }
  `,
];
