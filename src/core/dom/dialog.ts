import { DialogState } from '../state/dialog.ts';
import { AttributeWriter } from './attribute-writer.ts';
import type { Behavior } from './behavior.ts';

export interface DialogElements {
  /** Must be closed when attached. */
  dialog: HTMLDialogElement;
  /** Labels the dialog. */
  title?: HTMLElement;
}

export interface AttachDialogOptions {
  state?: DialogState;
  /** Close when a click starts and ends outside the dialog box. Defaults to true. */
  dismissOnOutsideClick?: boolean;
}

function isOutside(dialog: HTMLDialogElement, event: MouseEvent): boolean {
  if (event.target !== dialog) return false;
  const box = dialog.getBoundingClientRect();
  return (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  );
}

/**
 * Modal dialog behavior on the native `<dialog>`. The platform provides the
 * focus trap, inert background, top layer, Escape, and focus restore.
 *
 * Writes on the dialog: `ariaLabelledByElements` when a title is given.
 * `state.show()` calls `showModal()`; `state.close(value)` calls
 * `close(value)`; a native close (Escape, `<form method="dialog">`) updates
 * the state with the dialog's `returnValue`.
 */
export function attachDialog(
  elements: DialogElements,
  options: AttachDialogOptions = {},
): Behavior<DialogState> {
  const { dialog, title } = elements;
  const state = options.state ?? new DialogState();
  const writer = new AttributeWriter();
  const controller = new AbortController();
  const { signal } = controller;

  const render = (): void => {
    writer.writeReferences(dialog, { ariaLabelledByElements: title ? [title] : null });
    if (state.open && !dialog.open) dialog.showModal();
    else if (!state.open && dialog.open) dialog.close(state.returnValue);
  };

  // The close event is queued, so the dialog may have reopened before it runs.
  dialog.addEventListener(
    'close',
    () => {
      if (!dialog.open) state.close(dialog.returnValue);
    },
    { signal },
  );

  if (options.dismissOnOutsideClick ?? true) {
    let pressedOutside = false;
    dialog.addEventListener(
      'pointerdown',
      (event) => {
        pressedOutside = isOutside(dialog, event);
      },
      { signal },
    );
    dialog.addEventListener(
      'click',
      (event) => {
        if (pressedOutside && isOutside(dialog, event)) state.close();
        pressedOutside = false;
      },
      { signal },
    );
  }

  const unsubscribe = state.subscribe(render);
  render();

  return {
    state,
    sync: render,
    dispose() {
      controller.abort();
      unsubscribe();
      writer.releaseAll();
    },
  };
}
