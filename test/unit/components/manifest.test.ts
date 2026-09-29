// Reads the built manifest: run `npm run build` first.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Declaration {
  tagName?: string;
  attributes?: { name: string }[];
  members?: { name: string }[];
}

const manifest = JSON.parse(readFileSync(new URL('../../../dist/custom-elements.json', import.meta.url), 'utf8')) as {
  modules: { declarations?: Declaration[] }[];
};

function element(tagName: string): Declaration {
  const found = manifest.modules.flatMap((module) => module.declarations ?? []).find((d) => d.tagName === tagName);
  if (found === undefined) throw new Error(`${tagName} is not in the manifest`);
  return found;
}

describe('custom-elements.json', () => {
  it.each(['mb-checkbox', 'mb-switch'])('lists the inherited toggle attributes of %s', (tagName) => {
    const attributes = (element(tagName).attributes ?? []).map((attribute) => attribute.name);
    expect(attributes).toEqual(
      expect.arrayContaining(['checked', 'value', 'name', 'required', 'disabled', 'color', 'size']),
    );
  });

  it.each(['mb-checkbox', 'mb-switch'])('keeps groupDisabled internal on %s', (tagName) => {
    expect((element(tagName).members ?? []).map((member) => member.name)).not.toContain('groupDisabled');
  });
});
