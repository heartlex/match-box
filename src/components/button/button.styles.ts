import { css } from 'lit';
import { colorRoleStyles, focusRing, hostStyles, sizeStyles } from '../shared/styles.ts';

export const buttonStyles = [
  hostStyles,
  colorRoleStyles,
  sizeStyles,
  css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    [part='base'] {
      display: inline-flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      gap: var(--mb-button-gap, var(--_gap));
      min-block-size: var(--mb-button-height, var(--_height));
      margin: 0;
      padding-block: 0;
      padding-inline: var(--mb-button-padding-inline, var(--_padding-inline));
      border: var(--mb-button-border-width, 1px) solid var(--mb-button-border-color, transparent);
      border-radius: var(--mb-button-radius, var(--mb-radius-control));
      font-family: var(--mb-button-font-family, var(--mb-font-family-body));
      font-size: var(--mb-button-font-size, var(--_font-size));
      font-weight: var(--mb-button-font-weight, var(--mb-font-weight-strong));
      line-height: 1.25;
      cursor: pointer;
      background: var(--mb-button-bg, var(--_solid));
      color: var(--mb-button-fg, var(--_on-solid));
      transition-property: background-color, color, border-color, transform;
      transition-duration: var(--mb-button-duration, var(--mb-motion-duration-fast));
      transition-timing-function: var(--mb-motion-easing-standard);
    }

    [part='base']:hover:not(:disabled) {
      background: var(--mb-button-bg-hover, var(--_solid-hover));
    }

    [part='base']:active:not(:disabled) {
      transform: scale(var(--mb-button-press-scale, 0.97));
    }

    [part='base'].variant-outline {
      background: var(--mb-button-bg, transparent);
      color: var(--mb-button-fg, var(--_text));
      border-color: var(--mb-button-border-color, var(--_border));
    }

    [part='base'].variant-ghost {
      background: var(--mb-button-bg, transparent);
      color: var(--mb-button-fg, var(--_text));
    }

    [part='base'].variant-outline:hover:not(:disabled),
    [part='base'].variant-ghost:hover:not(:disabled) {
      background: var(--mb-button-bg-hover, var(--_subtle));
    }

    [part='base']:disabled {
      cursor: not-allowed;
      background: var(--mb-color-bg-disabled);
      color: var(--mb-color-fg-disabled);
      border-color: transparent;
    }

    [part='base'].variant-ghost:disabled {
      background: transparent;
    }

    [part='base']:focus-visible {
      ${focusRing}
    }

    [part='prefix'],
    [part='suffix'] {
      display: inline-flex;
      transition: opacity var(--mb-button-duration, var(--mb-motion-duration-fast)) var(--mb-motion-easing-enter);
    }

    @starting-style {
      [part='prefix'],
      [part='suffix'] {
        opacity: 0;
      }
    }

    slot[name='prefix']::slotted(svg),
    slot[name='suffix']::slotted(svg) {
      inline-size: var(--mb-button-icon-size, var(--_icon));
      block-size: var(--mb-button-icon-size, var(--_icon));
    }

    @media (forced-colors: active) {
      [part='base'] {
        border-color: ButtonText;
      }

      [part='base']:disabled {
        color: GrayText;
        border-color: GrayText;
      }
    }
  `,
];
