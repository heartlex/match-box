import { css, unsafeCSS, type CSSResult } from 'lit';
import { colorRoles } from './color.ts';
import { sizes } from './size.ts';

/** Box sizing and `hidden` support for every component. */
export const hostStyles = css`
  :host {
    box-sizing: border-box;
  }

  :host([hidden]) {
    display: none !important;
  }

  *,
  *::before,
  *::after {
    box-sizing: inherit;
  }

  [hidden] {
    display: none !important;
  }
`;

/** The focus ring every focusable part shows. */
export const focusRing = css`
  outline: var(--mb-focus-ring-width) solid var(--mb-color-border-focus);
  outline-offset: 2px;
`;

/**
 * Maps a `.color-<role>` class to private `--_solid`, `--_solid-hover`,
 * `--_on-solid`, `--_text`, `--_subtle`, and `--_border` properties, which
 * inherit to children and slotted content. Components always render an
 * explicit class, `color-neutral` included.
 */
export const colorRoleStyles: CSSResult = unsafeCSS(
  colorRoles
    .map((role) => {
      return `.color-${role} {
  --_solid: var(--mb-color-${role}-solid);
  --_solid-hover: var(--mb-color-${role}-solid-hover);
  --_on-solid: var(--mb-color-${role}-on-solid);
  --_text: var(--mb-color-${role}-text);
  --_subtle: var(--mb-color-${role}-subtle);
  --_border: var(--mb-color-${role}-border);
}`;
    })
    .join('\n'),
);

/**
 * Maps a `.size-<name>` class to private `--_height`, `--_padding-inline`,
 * `--_font-size`, `--_gap`, and `--_icon` properties, which inherit to
 * children and slotted content. Components always render an explicit class,
 * `size-md` included.
 */
export const sizeStyles: CSSResult = unsafeCSS(
  sizes
    .map((size) => {
      return `.size-${size} {
  --_height: var(--mb-size-${size}-height);
  --_padding-inline: var(--mb-size-${size}-padding-inline);
  --_font-size: var(--mb-size-${size}-font-size);
  --_gap: var(--mb-size-${size}-gap);
  --_icon: var(--mb-size-${size}-icon);
}`;
    })
    .join('\n'),
);
