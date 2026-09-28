import { describe, expect, it } from 'vitest';
import { publicManifest } from '../../../.storybook/manifest.ts';

describe('publicManifest', () => {
  it('drops static, private, and protected members, as the Eleventy API tables do', () => {
    const manifest = {
      schemaVersion: '2.1.0',
      modules: [
        {
          kind: 'javascript-module',
          path: 'src/button.ts',
          declarations: [
            {
              kind: 'class',
              name: 'MbButton',
              tagName: 'mb-button',
              members: [
                { kind: 'field', name: 'formAssociated', static: true },
                { kind: 'field', name: 'size', privacy: 'public' },
                { kind: 'field', name: '#internals', privacy: 'private' },
                { kind: 'method', name: 'update', privacy: 'protected' },
                { kind: 'method', name: 'formDisabledCallback' },
              ],
            },
            { kind: 'function', name: 'helper' },
          ],
        },
      ],
    };
    const [declaration] = publicManifest(manifest).modules[0].declarations ?? [];
    expect(declaration?.members?.map((member) => member.name)).toEqual(['size', 'formDisabledCallback']);
    expect(publicManifest(manifest).modules[0].declarations?.[1]).toEqual({ kind: 'function', name: 'helper' });
  });
});
