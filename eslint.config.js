import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', '_site', 'size-check', '_site-prefix-check', 'storybook-static', 'storybook-smoke-fixture'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['scripts/**/*.js', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['site/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
);
