import type {
  CheckboxGroupFixture,
  DialogFixture,
  DisclosureFixture,
  FieldFixture,
  ListboxFixture,
  ListboxMountSpec,
} from '../../src/core/testing/index.ts';

export function mountDisclosure(container: HTMLElement): DisclosureFixture;
export function mountDialog(container: HTMLElement): DialogFixture;
export function mountListbox(container: HTMLElement, spec: ListboxMountSpec): ListboxFixture;
export function mountCheckboxGroup(container: HTMLElement): CheckboxGroupFixture;
export function mountField(container: HTMLElement): FieldFixture;
