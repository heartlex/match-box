export default {
  // The mixins are included so their attributes appear on the elements that use them.
  globs: ['src/components/**/*.ts', 'src/lit/form-associated.ts', 'src/lit/delegates-focus.ts'],
  exclude: ['src/components/**/*.styles.ts', 'src/components/define/**', 'src/components/shared/**', 'src/components/index.ts'],
  outdir: 'dist',
  litelement: true,
};
