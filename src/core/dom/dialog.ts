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
  /**
   * Close when a click starts and ends outside the dialog box. Defaults to
   * true. Pass a function to decide at click time, e.g. from an attribute.
   */
  dismissOnOutsideClick?: boolean | (() => boolean);
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
 * the state with the dialog's `returnValue`, and a native open updates it
 * too. `sync()` rewrites references only; it never opens or closes.
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

  const writeReferences = (): void => {
    writer.writeReferences(dialog, { ariaLabelledByElements: title ? [title] : null });
  };

  const render = (): void => {
    writeReferences();
    if (state.open && !dialog.open) {
      dialog.returnValue = '';
      dialog.showModal();
    } else if (!state.open && dialog.open) {
      dialog.close(state.returnValue);
    }
  };

  // Adopt a dialog opened natively (showModal(), a command invoker) into the state.
  dialog.addEventListener(
    'toggle',
    (event) => {
      if (event.newState !== 'open' || state.open) return;
      dialog.returnValue = '';
      state.show();
    },
    { signal },
  );

  // The close event is queued, so the dialog may have reopened before it runs.
  dialog.addEventListener(
    'close',
    () => {
      if (!dialog.open) state.close(dialog.returnValue);
    },
    { signal },
  );

  const dismiss = options.dismissOnOutsideClick ?? true;
  const dismissOnOutsideClick = typeof dismiss === 'function' ? dismiss : () => dismiss;
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
      if (pressedOutside && isOutside(dialog, event) && dismissOnOutsideClick()) state.close();
      pressedOutside = false;
    },
    { signal },
  );

  const unsubscribe = state.subscribe(render);
  render();

  return {
    state,
    sync: writeReferences,
    dispose() {
      controller.abort();
      unsubscribe();
      writer.releaseAll();
    },
  };
}
