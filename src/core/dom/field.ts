import { uniqueId } from '../a11y/unique-id.ts';
import { AttributeWriter } from './attribute-writer.ts';

export interface FieldElements {
  /** A native form control. */
  control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  /** A `<label>` gets `for`; anything else is referenced with `aria-labelledby`. */
  label: HTMLElement;
  description?: HTMLElement | null;
  /** Filled with the error text, hidden while there is none. */
  error: HTMLElement;
}

/** What {@link attachField} returns. */
export interface FieldBehavior {
  /** Shows `message` until it is cleared with `''`, whatever the control's validity. */
  setError(message: string): void;
  /** Re-reads the control's validity and rewrites the field. */
  sync(): void;
  /** Removes listeners, ids it created, and every attribute it wrote. */
  dispose(): void;
}

/**
 * Field behavior for plain HTML: links a label, a description, and an error
 * to a native control, and shows the control's `validationMessage` once the
 * user changed the control and left it, or a submit attempt reported it.
 */
export function attachField(elements: FieldElements): FieldBehavior {
  const { control, label, description = null, error } = elements;
  const writer = new AttributeWriter();
  const controller = new AbortController();
  const { signal } = controller;
  const created: HTMLElement[] = [];
  let custom = '';
  let edited = false;
  let interacted = false;

  const idOf = (element: HTMLElement): string => {
    if (element.id === '') {
      element.id = uniqueId('mb-field');
      created.push(element);
    }
    return element.id;
  };

  const render = (): void => {
    const shown = custom !== '' ? custom : interacted && !control.validity.valid ? control.validationMessage : '';
    error.textContent = shown;
    error.hidden = shown === '';
    const nativeLabel = label.localName === 'label';
    writer.write(label, nativeLabel ? { for: idOf(control) } : {});
    writer.write(error, { 'aria-live': 'polite' });
    const described = [description ? idOf(description) : null, shown === '' ? null : idOf(error)].filter(
      (id): id is string => id !== null,
    );
    writer.write(control, {
      'aria-labelledby': nativeLabel ? null : idOf(label),
      'aria-describedby': described.length === 0 ? null : described.join(' '),
      'aria-invalid': shown === '' ? null : 'true',
    });
  };

  const onEdit = (): void => {
    edited = true;
    if (interacted) render();
  };
  control.addEventListener('input', onEdit, { signal });
  control.addEventListener('change', onEdit, { signal });
  control.addEventListener(
    'focusout',
    () => {
      if (!edited) return;
      interacted = true;
      render();
    },
    { signal },
  );
  control.addEventListener(
    'invalid',
    () => {
      interacted = true;
      render();
    },
    { signal },
  );
  control.form?.addEventListener(
    'reset',
    () => {
      // The reset event fires before the controls are reset.
      setTimeout(() => {
        // dispose() may already have run by the time this fires.
        if (signal.aborted) return;
        edited = false;
        interacted = false;
        render();
      });
    },
    { signal },
  );

  render();

  return {
    setError(message) {
      custom = message;
      render();
    },
    sync: render,
    dispose() {
      controller.abort();
      writer.releaseAll();
      error.textContent = '';
      for (const element of created) element.removeAttribute('id');
    },
  };
}
