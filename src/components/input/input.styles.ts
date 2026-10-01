import { css } from 'lit';
import { visuallyHidden } from '../shared/field-control.ts';
import { colorRoleStyles, hostStyles, neutralAccent, sizeStyles } from '../shared/styles.ts';

export const inputStyles = [
  hostStyles,
  colorRoleStyles,
  neutralAccent,
  sizeStyles,
  visuallyHidden,
  css`
    :host {
      display: inline-flex;
      vertical-align: middle;
    }

    [part='base'] {
      display: flex;
      flex: 1;
      align-items: center;
      gap: var(--_gap);
      min-block-size: var(--mb-input-height, var(--_height));
      padding-inline: var(--mb-input-padding-inline, var(--mb-space-4));
      border: var(--mb-border-width-control) solid var(--mb-input-border-color, var(--mb-color-border-strong));
      border-radius: var(--mb-input-radius, var(--mb-radius-control));
      background: var(--mb-input-bg, var(--mb-color-bg-surface));
      color: var(--mb-color-fg-default);
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-input-font-size, var(--_font-size));
      line-height: 1.25;
      letter-spacing: normal;
      cursor: text;
      transition-property: border-color;
      transition-duration: var(--mb-input-duration, var(--mb-motion-duration-fast));
      transition-timing-function: var(--mb-motion-easing-standard);
    }

    [part='base'].size-sm {
      padding-inline: var(--mb-input-padding-inline, var(--mb-space-3));
    }

    [part='base']:hover {
      border-color: var(--mb-input-border-color-hover, var(--_border));
    }

    /* A soft halo against the border, in the border's role color at 20%:
       the border carries the focus contrast, so the halo stays faint. */
    [part='base']:focus-within {
      border-color: var(--_border);
      outline: 3px solid var(--mb-input-focus-ring-color, color-mix(in srgb, var(--_border) 20%, transparent));
      outline-offset: 0;
    }

    [part='input'] {
      flex: 1;
      min-inline-size: 0;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      line-height: 1.25;
      outline: none;
    }

    [part='input']::placeholder {
      color: var(--mb-input-placeholder-color, var(--mb-color-fg-subtle));
    }

    [part='prefix'],
    [part='suffix'] {
      display: inline-flex;
      align-items: center;
      color: var(--mb-color-fg-muted);
    }

    :host(:state(user-invalid)) [part='base'] {
      border-color: var(--mb-input-border-color-invalid, var(--mb-color-danger-border));
    }

    :host(:disabled) [part='base'] {
      cursor: not-allowed;
      background: var(--mb-color-bg-disabled);
      color: var(--mb-color-fg-disabled);
      border-color: var(--mb-color-border-default);
    }

    @media (forced-colors: active) {
      [part='base'] {
        border-color: CanvasText;
      }

      :host(:state(user-invalid)) [part='base'] {
        border-width: 2px;
      }
    }
  `,
];
