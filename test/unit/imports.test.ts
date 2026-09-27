import { describe, expect, it } from 'vitest';

// Node has no window or document, so any DOM access at module scope throws here.
describe('entry points', () => {
  it.each([
    '../../src/core/index.ts',
    '../../src/core/state/index.ts',
    '../../src/core/dom/index.ts',
    '../../src/core/a11y/index.ts',
    '../../src/lit/index.ts',
    '../../src/components/index.ts',
  ])('%s imports without touching the DOM', async (path) => {
    expect(typeof globalThis.document).toBe('undefined');
    const module = (await import(path)) as object;
    expect(Object.keys(module).length).toBeGreaterThan(0);
  });
});
