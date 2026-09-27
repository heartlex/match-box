// Component API data, generated from source by `cem analyze` during `npm run build`.
import { readFileSync } from 'node:fs';

export default function () {
  const manifest = JSON.parse(readFileSync(new URL('../../dist/custom-elements.json', import.meta.url), 'utf8'));
  const elements = {};
  for (const module of manifest.modules) {
    for (const declaration of module.declarations ?? []) {
      if (declaration.tagName) elements[declaration.tagName] = declaration;
    }
  }
  return elements;
}
