import { css } from 'lit';
import { visuallyHidden } from '../shared/field-control.ts';
import { colorRoleStyles, focusRing, hostStyles, neutralAccent, sizeStyles } from '../shared/styles.ts';

export const switchStyles = [
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
      gap: var(--_gap);
      min-block-size: var(--_height);
      color: var(--mb-color-fg-default);
      font-family: var(--mb-font-family-body);
      font-size: var(--_font-size);
      line-height: 1.25;
      letter-spacing: normal;
      cursor: pointer;
      --_track-width: var(--mb-switch-track-width, 2.25rem);
      --_track-height: var(--mb-switch-track-height, 1.25rem);
      --_inset: 0.1875rem;
      --_thumb: var(--mb-switch-thumb-size, calc(var(--_track-height) - 2 * var(--_inset)));
    }

    [part='base'].size-sm {
      --_track-width: var(--mb-switch-track-width, 2rem);
      --_track-height: var(--mb-switch-track-height, 1.125rem);
    }

    [part='base'].size-lg {
      --_track-width: var(--mb-switch-track-width, 2.75rem);
      --_track-height: var(--mb-switch-track-height, 1.5rem);
    }

    input {
      position: absolute;
      inset-inline-start: 0;
      inline-size: var(--_track-width);
      block-size: var(--_track-height);
      margin: 0;
      opacity: 0;
      cursor: inherit;
    }

    [part='track'] {
      display: inline-flex;
      flex: none;
      align-items: center;
      inline-size: var(--_track-width);
      block-size: var(--_track-height);
      padding: calc(var(--_inset) - var(--mb-border-width-control));
      border: var(--mb-border-width-control) solid var(--mb-switch-border-color, var(--mb-color-border-strong));
      border-radius: 999px;
      background: var(--mb-switch-track-bg, var(--mb-color-bg-surface));
      transition-property: background-color, border-color;
      transition-duration: var(--mb-switch-duration, var(--mb-motion-duration-medium));
      transition-timing-function: var(--mb-motion-easing-standard);
    }

    [part='thumb'] {
      inline-size: var(--_thumb);
      block-size: var(--_thumb);
      border-radius: 50%;
      background: var(--mb-switch-thumb-bg, var(--mb-color-border-strong));
      transition-property: transform, background-color;
      transition-duration: var(--mb-switch-duration, var(--mb-motion-duration-medium));
      transition-timing-function: var(--mb-motion-easing-spring);
    }

    input:checked + [part='track'] {
      border-color: var(--mb-switch-track-bg-checked, var(--_solid));
      background: var(--mb-switch-track-bg-checked, var(--_solid));
    }

    input:checked + [part='track'] [part='thumb'] {
      background: var(--mb-switch-thumb-bg-checked, var(--_on-solid));
      transform: translateX(calc(var(--_track-width) - var(--_thumb) - 2 * var(--_inset)));
    }

    :host(:dir(rtl)) input:checked + [part='track'] [part='thumb'] {
      transform: translateX(calc((var(--_track-width) - var(--_thumb) - 2 * var(--_inset)) * -1));
    }

    input:focus-visible + [part='track'] {
      ${focusRing}
    }

    :host(:state(user-invalid)) [part='track'] {
      box-shadow: 0 0 0 1px var(--mb-color-danger-border);
    }

    [part='base']:has(input:disabled) {
      cursor: not-allowed;
      color: var(--mb-color-fg-disabled);
    }

    input:disabled + [part='track'] {
      border-color: var(--mb-color-border-default);
      background: var(--mb-color-bg-disabled);
    }

    input:disabled + [part='track'] [part='thumb'] {
      background: var(--mb-color-border-default);
    }

    input:disabled:checked + [part='track'] {
      border-color: var(--_subtle-active);
      background: var(--_subtle-active);
    }

    input:disabled:checked + [part='track'] [part='thumb'] {
      background: var(--mb-color-bg-surface);
    }

    @media (forced-colors: active) {
      [part='track'] {
        border-color: CanvasText;
      }

      input:checked + [part='track'] {
        background: Highlight;
      }

      [part='thumb'] {
        background: CanvasText;
      }

      :host(:state(user-invalid)) [part='track'] {
        border-color: Mark;
      }
    }
  `,
];
