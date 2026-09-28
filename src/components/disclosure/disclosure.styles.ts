import { css } from 'lit';
import { colorRoleStyles, focusRing, hostStyles, sizeStyles } from '../shared/styles.ts';

export const disclosureStyles = [
  hostStyles,
  colorRoleStyles,
  sizeStyles,
  css`
    :host {
      --_duration: var(--mb-disclosure-duration, var(--mb-motion-duration-medium));
      display: block;
      border-block-end: 1px solid var(--mb-disclosure-border-color, var(--mb-color-border-default));
    }

    [part='heading'] {
      margin: 0;
    }

    [part='trigger'] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--mb-disclosure-gap, var(--_gap));
      inline-size: 100%;
      min-block-size: var(--mb-disclosure-height, var(--_height));
      margin: 0;
      padding-block: var(--mb-disclosure-padding-block, var(--mb-space-stack-sm));
      padding-inline: var(--mb-disclosure-padding-inline, var(--_padding-inline));
      border: 0;
      background: var(--mb-disclosure-trigger-bg, transparent);
      color: var(--mb-disclosure-trigger-fg, var(--_text));
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-disclosure-font-size, var(--_font-size));
      font-weight: var(--mb-disclosure-font-weight, var(--mb-font-weight-strong));
      text-align: start;
      cursor: pointer;
      transition: background-color var(--mb-motion-duration-fast) var(--mb-motion-easing-standard);
    }

    [part='trigger']:hover {
      background: var(--mb-disclosure-trigger-bg-hover, var(--_subtle));
    }

    [part='trigger']:focus-visible {
      ${focusRing}
    }

    [part='icon'] {
      flex: none;
      inline-size: calc(var(--mb-disclosure-icon-size, var(--_icon)) / 2);
      block-size: calc(var(--mb-disclosure-icon-size, var(--_icon)) / 2);
      border-inline-end: 2px solid currentColor;
      border-block-end: 2px solid currentColor;
      transform: translateY(-25%) rotate(45deg);
      transition: transform var(--_duration) var(--mb-motion-easing-spring);
    }

    :host(:state(open)) [part='icon'] {
      transform: translateY(25%) rotate(-135deg);
    }

    [part='panel'] {
      display: grid;
      grid-template-rows: 1fr;
      color: var(--mb-color-fg-default);
      transition-property: grid-template-rows, visibility;
      transition-duration: var(--_duration);
      transition-timing-function: var(--mb-motion-easing-standard);
    }

    :host(:not(:state(open))) [part='panel'] {
      grid-template-rows: 0fr;
      visibility: hidden;
    }

    .clip {
      min-block-size: 0;
      overflow: hidden;
    }

    .content {
      padding-block: var(--mb-disclosure-panel-padding-block, var(--mb-space-stack-md));
      padding-inline: var(--mb-disclosure-padding-inline, var(--_padding-inline));
      transition-property: opacity, transform;
      transition-duration: var(--_duration);
      transition-timing-function: var(--mb-motion-easing-enter);
    }

    :host(:not(:state(open))) .content {
      opacity: 0;
      transform: translateY(0.25rem);
    }

    @media (forced-colors: active) {
      :host {
        border-block-end-color: CanvasText;
      }

      [part='trigger'] {
        color: ButtonText;
      }
    }
  `,
];
