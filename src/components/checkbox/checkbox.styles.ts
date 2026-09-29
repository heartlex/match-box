import { css } from 'lit';
import { visuallyHidden } from '../shared/field-control.ts';
import { colorRoleStyles, focusRing, hostStyles, neutralAccent, sizeStyles } from '../shared/styles.ts';

export const checkboxStyles = [
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
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--mb-checkbox-gap, var(--_gap));
      min-block-size: var(--_height);
      color: var(--mb-color-fg-default);
      font-family: var(--mb-font-family-body);
      font-size: var(--_font-size);
      line-height: 1.25;
      letter-spacing: normal;
      cursor: pointer;
      --_box: var(--mb-checkbox-size, 1.125rem);
    }

    [part='base'].size-sm {
      --_box: var(--mb-checkbox-size, 1rem);
    }

    [part='base'].size-lg {
      --_box: var(--mb-checkbox-size, 1.25rem);
    }

    input {
      position: absolute;
      inset-inline-start: 0;
      inline-size: var(--_box);
      block-size: var(--_box);
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }

    [part='box'] {
      display: inline-grid;
      flex: none;
      place-items: center;
      inline-size: var(--_box);
      block-size: var(--_box);
      border: var(--mb-border-width-control) solid var(--mb-checkbox-border-color, var(--mb-color-border-strong));
      border-radius: var(--mb-checkbox-radius, var(--mb-radius-2));
      background: var(--mb-checkbox-bg, var(--mb-color-bg-surface));
      transition-property: background-color, border-color;
      transition-duration: var(--mb-checkbox-duration, var(--mb-motion-duration-fast));
      transition-timing-function: var(--mb-motion-easing-standard);
    }

    [part='base']:hover input:not(:disabled) + [part='box'] {
      border-color: var(--mb-checkbox-border-color-hover, var(--_border));
    }

    [part='mark'] {
      inline-size: 100%;
      block-size: 100%;
      fill: none;
      stroke: var(--mb-checkbox-mark-color, var(--_on-solid));
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      opacity: 0;
    }

    input:checked + [part='box'],
    input:indeterminate + [part='box'] {
      border-color: var(--mb-checkbox-bg-checked, var(--_solid));
      background: var(--mb-checkbox-bg-checked, var(--_solid));
    }

    input:checked + [part='box'] [part='mark'],
    input:indeterminate + [part='box'] [part='mark'] {
      opacity: 1;
    }

    input:focus-visible + [part='box'] {
      ${focusRing}
    }

    :host(:state(user-invalid)) [part='box'] {
      border-color: var(--mb-color-danger-border);
    }

    [part='base']:has(input:disabled) {
      cursor: not-allowed;
      color: var(--mb-color-fg-disabled);
    }

    input:disabled + [part='box'] {
      border-color: var(--mb-color-border-default);
      background: var(--mb-color-bg-disabled);
    }

    input:disabled:checked + [part='box'],
    input:disabled:indeterminate + [part='box'] {
      border-color: var(--_subtle-active);
      background: var(--_subtle-active);
    }

    input:disabled + [part='box'] [part='mark'] {
      stroke: var(--mb-color-bg-surface);
    }

    @media (forced-colors: active) {
      [part='box'] {
        border-color: CanvasText;
      }

      input:checked + [part='box'],
      input:indeterminate + [part='box'] {
        background: Highlight;
      }

      [part='mark'] {
        stroke: HighlightText;
      }
    }
  `,
];
