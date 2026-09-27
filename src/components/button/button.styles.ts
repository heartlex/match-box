import { css } from 'lit';
import { colorRoleStyles, focusRing, hostStyles } from '../shared/styles.ts';

export const buttonStyles = [
  hostStyles,
  colorRoleStyles,
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
      gap: var(--mb-button-gap, var(--mb-space-inline-sm));
      min-block-size: var(--mb-button-height, 2.25rem);
      margin: 0;
      padding-block: 0;
      padding-inline: var(--mb-button-padding-inline, var(--mb-space-inline-md));
      border: var(--mb-button-border-width, 1px) solid var(--mb-button-border-color, transparent);
      border-radius: var(--mb-button-radius, var(--mb-radius-control));
      font-family: var(--mb-button-font-family, var(--mb-font-family-body));
      font-size: var(--mb-button-font-size, var(--mb-font-size-body));
      font-weight: var(--mb-button-font-weight, var(--mb-font-weight-strong));
      line-height: 1.25;
      cursor: pointer;
      background: var(--mb-button-bg, var(--_solid));
      color: var(--mb-button-fg, var(--_on-solid));
    }

    [part='base']:hover:not(:disabled) {
      background: var(--mb-button-bg-hover, var(--_solid-hover));
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
