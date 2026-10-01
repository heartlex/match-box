/** The five color roles. Every role is eight semantic tokens in tokens.css. */
export const colorRoles = ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] as const;

export type ColorRole = (typeof colorRoles)[number];

/** Returns `value` if it is a color role, otherwise `neutral`. */
export function colorRole(value: string | null | undefined): ColorRole {
  return colorRoles.find((role) => role === value) ?? 'neutral';
}
