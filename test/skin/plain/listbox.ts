import { attachListbox } from '../../../src/core/dom/index.ts';
import type { ListboxFixture, ListboxMountSpec } from '../../../src/core/testing/index.ts';

/** Minimal plain DOM listbox with a visible label. */
export function mountPlainListbox(spec: ListboxMountSpec): ListboxFixture {
  const container = document.createElement('div');
  const label = document.createElement('span');
  label.textContent = 'Fruit';
  const root = document.createElement('div');
  const options = spec.options.map((option) => {
    const element = document.createElement('div');
    element.textContent = option.label;
    if (option.disabled) element.setAttribute('data-disabled', '');
    return element;
  });
  root.append(...options);
  container.append(label, root);
  document.body.append(container);
  const behavior = attachListbox({ root, label, items: () => options }, { multiple: spec.multiple });
  return {
    root,
    options,
    teardown() {
      behavior.dispose();
      container.remove();
    },
  };
}
