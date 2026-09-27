import { css } from 'lit';
import { colorRoleStyles, hostStyles } from '../shared/styles.ts';

export const listboxStyles = [
  hostStyles,
  colorRoleStyles,
  css`
    :host {
      display: block;
    }

    [part='label'] {
      display: block;
      margin-block-end: var(--mb-space-stack-sm);
      color: var(--mb-color-fg-default);
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-font-size-body);
      font-weight: var(--mb-font-weight-strong);
    }

    [part='listbox'] {
      --_check-display: none;
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-block-size: var(--mb-listbox-max-height, none);
      overflow-y: auto;
      padding: var(--mb-listbox-padding, var(--mb-space-stack-sm));
      border: 1px solid var(--mb-listbox-border-color, var(--mb-color-border-strong));
      border-radius: var(--mb-listbox-radius, var(--mb-radius-control));
      background: var(--mb-listbox-bg, var(--mb-color-bg-surface));
      font-family: var(--mb-font-family-body);
      font-size: var(--mb-font-size-body);
      line-height: var(--mb-line-height-body);
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
