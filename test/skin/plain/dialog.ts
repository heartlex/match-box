import { attachDialog } from '../../../src/core/dom/index.ts';
import type { DialogFixture } from '../../../src/core/testing/index.ts';

/** Minimal plain DOM dialog. The trigger calls `state.show()`. */
export function mountPlainDialog(): DialogFixture {
  const container = document.createElement('div');
  container.innerHTML = `
    <button type="button">Open</button>
    <dialog>
      <h2>Confirm order</h2>
      <form method="dialog"><button value="confirm">Confirm</button></form>
    </dialog>`;
  document.body.append(container);
  const trigger = container.querySelector('button') as HTMLButtonElement;
  const dialog = container.querySelector('dialog') as HTMLDialogElement;
  const title = dialog.querySelector('h2') as HTMLElement;
  const confirm = dialog.querySelector('button') as HTMLElement;
  const behavior = attachDialog({ dialog, title });
  trigger.addEventListener('click', () => behavior.state.show());
  return {
    trigger,
    dialog,
    title,
    confirm,
    teardown() {
      behavior.dispose();
      container.remove();
    },
  };
}
