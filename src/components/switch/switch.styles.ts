import { css } from 'lit';
import { visuallyHidden } from '../shared/field-control.ts';
import { colorRoleStyles, focusRing, hostStyles, sizeStyles } from '../shared/styles.ts';

export const switchStyles = [
  hostStyles,
  colorRoleStyles,
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
      --_track-width: var(--mb-switch-track-width, calc(var(--_icon) * 2));
      --_track-height: var(--mb-switch-track-height, calc(var(--_icon) + 0.25rem));
      --_thumb: var(--mb-switch-thumb-size, var(--_icon));
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
      padding: 0.125rem;
      border-radius: 999px;
      background: var(--mb-switch-track-bg, var(--mb-color-border-strong));
      transition-property: background-color;
      transition-duration: var(--mb-switch-duration, var(--mb-motion-duration-medium));
      transition-timing-function: var(--mb-motion-easing-standard);
    }

    [part='thumb'] {
      inline-size: var(--_thumb);
      block-size: var(--_thumb);
      border-radius: 50%;
      background: var(--mb-switch-thumb-bg, var(--mb-color-bg-surface));
      transition-property: transform;
      transition-duration: var(--mb-switch-duration, var(--mb-motion-duration-medium));
      transition-timing-function: var(--mb-motion-easing-spring);
    }

    input:checked + [part='track'] {
      background: var(--mb-switch-track-bg-checked, var(--_solid));
    }

    input:checked + [part='track'] [part='thumb'] {
      transform: translateX(calc(var(--_track-width) - var(--_thumb) - 0.25rem));
    }

    :host(:dir(rtl)) input:checked + [part='track'] [part='thumb'] {
      transform: translateX(calc((var(--_track-width) - var(--_thumb) - 0.25rem) * -1));
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
      background: var(--mb-color-bg-disabled);
    }

    @media (forced-colors: active) {
      [part='track'] {
        border: 1px solid CanvasText;
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
