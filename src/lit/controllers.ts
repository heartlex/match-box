import type { ReactiveControllerHost } from 'lit';
import { attachDialog, type AttachDialogOptions, type DialogElements } from '../core/dom/dialog.ts';
import {
  attachDisclosure,
  type AttachDisclosureOptions,
  type DisclosureElements,
} from '../core/dom/disclosure.ts';
import { attachListbox, type AttachListboxOptions, type ListboxElements } from '../core/dom/listbox.ts';
import { DialogState } from '../core/state/dialog.ts';
import { DisclosureState, type DisclosureStateOptions } from '../core/state/disclosure.ts';
import { ListboxState } from '../core/state/listbox.ts';
import { BehaviorController } from './behavior-controller.ts';

/** Lit controller for {@link attachListbox}. */
export class ListboxController extends BehaviorController<ListboxState, ListboxElements> {
  constructor(host: ReactiveControllerHost, elements: () => ListboxElements, options: AttachListboxOptions = {}) {
    super(host, options.state ?? new ListboxState(options), elements, (els, state) =>
      attachListbox(els, { ...options, state }),
    );
  }
}

/** Lit controller for {@link attachDisclosure}. */
export class DisclosureController extends BehaviorController<DisclosureState, DisclosureElements> {
  constructor(
    host: ReactiveControllerHost,
    elements: () => DisclosureElements,
    options: AttachDisclosureOptions & DisclosureStateOptions = {},
  ) {
    super(host, options.state ?? new DisclosureState(options), elements, (els, state) =>
      attachDisclosure(els, { state }),
    );
  }
}

/** Lit controller for {@link attachDialog}. */
export class DialogController extends BehaviorController<DialogState, DialogElements> {
  constructor(host: ReactiveControllerHost, elements: () => DialogElements, options: AttachDialogOptions = {}) {
    super(host, options.state ?? new DialogState(), elements, (els, state) =>
      attachDialog(els, { ...options, state }),
    );
  }
}
