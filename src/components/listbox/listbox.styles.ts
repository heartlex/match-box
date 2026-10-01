import { css } from 'lit';
import { visuallyHidden } from '../shared/field-control.ts';
import { colorRoleStyles, hostStyles, neutralAccent, sizeStyles } from '../shared/styles.ts';

export const listboxStyles = [
  hostStyles,
  colorRoleStyles,
  neutralAccent,
  sizeStyles,
  visuallyHidden,
  css`
    :host {
      display: block;
    }

    [part='label'] {
      display: block;
      margin-block-end: var(--mb-space-stack-sm);
      color: var(--mb-color-fg-default);
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-font-size-label);
      font-weight: var(--mb-font-weight-medium);
      line-height: var(--mb-line-height-body);
      letter-spacing: normal;
    }

    [part='listbox'] {
      --_enter-duration: var(--mb-listbox-duration, var(--mb-motion-duration-medium));
      --_enter-easing: var(--mb-motion-easing-enter);
      --_check-display: none;
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-block-size: var(--mb-listbox-max-height, none);
      overflow-y: auto;
      padding: var(--mb-listbox-padding, var(--mb-space-1));
      border: 1px solid var(--mb-listbox-border-color, var(--mb-color-border-default));
      border-radius: var(--mb-listbox-radius, var(--mb-radius-surface));
      box-shadow: var(--mb-listbox-shadow, var(--mb-shadow-overlay));
      background: var(--mb-listbox-bg, var(--mb-color-bg-surface));
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-font-size-body);
      line-height: var(--mb-line-height-body);
      letter-spacing: normal;
    }

    [part='listbox'].multiple {
      --_check-display: inline-block;
    }

    :host(:state(user-invalid)) [part='listbox'] {
      border-color: var(--mb-listbox-border-color-invalid, var(--mb-color-danger-border));
    }

    :host(:disabled) [part='listbox'] {
      background: var(--mb-color-bg-disabled);
    }

    @media (forced-colors: active) {
      [part='listbox'] {
        border-color: CanvasText;
      }
    }
  `,
];
