import { css } from 'lit';
import { colorRoleStyles, focusRing, hostStyles } from '../shared/styles.ts';

export const disclosureStyles = [
  hostStyles,
  colorRoleStyles,
  css`
    :host {
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
      gap: var(--mb-space-inline-md);
      inline-size: 100%;
      margin: 0;
      padding-block: var(--mb-disclosure-padding-block, var(--mb-space-stack-md));
      padding-inline: var(--mb-disclosure-padding-inline, var(--mb-space-inline-sm));
      border: 0;
      background: var(--mb-disclosure-trigger-bg, transparent);
      color: var(--mb-disclosure-trigger-fg, var(--_text));
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-font-size-body);
      font-weight: var(--mb-disclosure-font-weight, var(--mb-font-weight-strong));
      text-align: start;
      cursor: pointer;
    }

    [part='trigger']:hover {
      background: var(--mb-disclosure-trigger-bg-hover, var(--_subtle));
    }

    [part='trigger']:focus-visible {
      ${focusRing}
    }

    [part='icon'] {
      flex: none;
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-inline-end: 2px solid currentColor;
      border-block-end: 2px solid currentColor;
      transform: translateY(-25%) rotate(45deg);
    }

    :host(:state(open)) [part='icon'] {
      transform: translateY(25%) rotate(-135deg);
    }

    [part='panel'] {
      padding-block: var(--mb-disclosure-panel-padding-block, var(--mb-space-stack-md));
      padding-inline: var(--mb-disclosure-padding-inline, var(--mb-space-inline-sm));
      color: var(--mb-color-fg-default);
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
