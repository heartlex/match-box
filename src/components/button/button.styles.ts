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
      border: var(--mb-button-border-width, var(--mb-border-width-control)) solid var(--mb-button-border-color, transparent);
      border-radius: var(--mb-button-radius, var(--mb-radius-control));
      font-family: var(--mb-button-font-family, var(--mb-font-family-body));
      font-size: var(--mb-button-font-size, var(--_font-size));
      font-weight: var(--mb-button-font-weight, var(--mb-font-weight-medium));
      line-height: 1.25;
      letter-spacing: normal;
      cursor: pointer;
      background: var(--mb-button-bg, var(--_solid));
      color: var(--mb-button-fg, var(--_on-solid));
      transition-property: background-color, color, border-color, transform;
      transition-duration: var(--mb-button-duration, var(--mb-motion-duration-fast));
      transition-timing-function: var(--mb-motion-easing-standard);
    }

    [part='base'].icon-only {
      inline-size: var(--mb-button-height, var(--_height));
      padding-inline: 0;
    }

    a[part='base'] {
      text-decoration: none;
    }

    [part='base']:hover:not(:disabled, [aria-disabled='true']) {
      background: var(--mb-button-bg-hover, var(--_solid-hover));
    }

    [part='base']:active:not(:disabled, [aria-disabled='true']) {
      background: var(--mb-button-bg-active, var(--_solid-active));
      transform: scale(var(--mb-button-press-scale));
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

    [part='base'].variant-outline:hover:not(:disabled, [aria-disabled='true']),
    [part='base'].variant-ghost:hover:not(:disabled, [aria-disabled='true']) {
      background: var(--mb-button-bg-hover, var(--_subtle));
    }

    [part='base'].variant-outline:active:not(:disabled, [aria-disabled='true']),
    [part='base'].variant-ghost:active:not(:disabled, [aria-disabled='true']) {
      background: var(--mb-button-bg-active, var(--_subtle-active));
    }

    [part='base']:disabled,
    [part='base'][aria-disabled='true'] {
      cursor: not-allowed;
      background: var(--mb-color-bg-disabled);
      color: var(--mb-color-fg-disabled);
      border-color: transparent;
    }

    [part='base'].variant-ghost:disabled,
    [part='base'].variant-ghost[aria-disabled='true'] {
      background: transparent;
    }

    [part='base'].variant-outline:disabled,
    [part='base'].variant-outline[aria-disabled='true'] {
      background: transparent;
      border-color: var(--mb-color-border-default);
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

      [part='base']:disabled,
      [part='base'][aria-disabled='true'] {
        color: GrayText;
        border-color: GrayText;
      }
    }
  `,
];
