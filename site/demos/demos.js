// Plain HTML demos. Each mount function returns the elements a conformance
// suite needs, so test/browser/demos.test.ts runs the suites against them.
import { attachDialog, attachDisclosure, attachListbox } from 'match-box/core';

export function mountDisclosure(container) {
  container.innerHTML = `
    <button type="button">Shipping details</button>
    <div hidden><p>Orders ship within two business days.</p></div>`;
  const trigger = container.querySelector('button');
  const panel = container.querySelector('div');
  const behavior = attachDisclosure({ trigger, panel });
  behavior.state.subscribe(() => {
    panel.hidden = !behavior.state.expanded;
  });
  return {
    trigger,
    panel,
    teardown() {
      behavior.dispose();
      container.replaceChildren();
    },
  };
}

export function mountDialog(container) {
  container.innerHTML = `
    <button type="button">Place order</button>
    <dialog>
      <h2>Confirm order</h2>
      <p>Your card will be charged now.</p>
      <form method="dialog">
        <button value="cancel">Cancel</button>
        <button value="confirm">Confirm</button>
      </form>
    </dialog>`;
  const trigger = container.querySelector('button');
  const dialog = container.querySelector('dialog');
  const title = dialog.querySelector('h2');
  const behavior = attachDialog({ dialog, title });
  trigger.addEventListener('click', () => behavior.state.show());
  return {
    trigger,
    dialog,
    title,
    confirm: dialog.querySelector('button[value="confirm"]'),
    teardown() {
      behavior.dispose();
      container.replaceChildren();
    },
  };
}

export function mountListbox(container, spec) {
  container.innerHTML = '<span>Fruit</span><div></div>';
  const [label, root] = container.children;
  const options = spec.options.map((option) => {
    const element = document.createElement('div');
    element.textContent = option.label;
    if (option.disabled) element.setAttribute('data-disabled', '');
    return element;
  });
  root.append(...options);
  const behavior = attachListbox({ root, label, items: () => options }, { multiple: spec.multiple });
  return {
    root,
    options,
    teardown() {
      behavior.dispose();
      container.replaceChildren();
    },
  };
}
