import { esbuildPlugin } from '@web/dev-server-esbuild';
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
  files: 'test/browser/**/*.test.ts',
  nodeResolve: true,
  plugins: [esbuildPlugin({ ts: true, target: 'es2022', tsconfig: 'tsconfig.json' })],
  browsers: ['chromium', 'firefox', 'webkit'].map((product) => playwrightLauncher({ product })),
  testFramework: { config: { timeout: 5000 } },
};
