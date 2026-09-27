import { expect } from 'chai';
import { LitElement, html } from 'lit';
import {
  dialogConformance,
  disclosureConformance,
  listboxConformance,
  type ListboxMountSpec,
} from '../../src/core/testing/index.ts';
import { DialogController } from '../../src/lit/index.ts';
import { TestDialog, TestDisclosure, TestListbox } from '../skin/lit.ts';
import { expectNoAxeViolations } from '../support/axe.ts';
import { driver } from '../support/driver.ts';

const audit = expectNoAxeViolations;

async function mountElement<T extends HTMLElement & { updateComplete: Promise<boolean> }>(element: T): Promise<T> {
  document.body.append(element);
  await element.updateComplete;
  await element.updateComplete;
  return element;
}

disclosureConformance({
  name: 'lit',
  driver,
  audit,
  async mount() {
    const element = await mountElement(new TestDisclosure());
    const root = element.renderRoot;
    return {
      trigger: root.querySelector('button') as HTMLElement,
      panel: root.querySelector('div') as HTMLElement,
      teardown: () => element.remove(),
    };
  },
});

dialogConformance({
  name: 'lit',
  driver,
  audit,
  async mount() {
    const element = await mountElement(new TestDialog());
    const root = element.renderRoot;
    const dialog = root.querySelector('dialog') as HTMLDialogElement;
    return {
      trigger: root.querySelector('button') as HTMLElement,
      dialog,
      title: dialog.querySelector('h2') as HTMLElement,
      confirm: dialog.querySelector('button') as HTMLElement,
      teardown: () => element.remove(),
    };
  },
});

listboxConformance({
  name: 'lit',
  driver,
  audit,
  async mount(spec: ListboxMountSpec) {
    const element = new TestListbox();
    element.multiple = spec.multiple;
    element.options = spec.options;
    await mountElement(element);
    const root = element.renderRoot;
    return {
      root: root.querySelector('[part=listbox]') as HTMLElement,
      options: [...root.querySelectorAll<HTMLElement>('[part=option]')],
      teardown: () => element.remove(),
    };
  },
});

class TestLateDialog extends LitElement {
  static override properties = { ready: { type: Boolean } };
  declare ready: boolean;
  readonly dialog = new DialogController(this, () => ({ dialog: this.renderRoot.querySelector('dialog') }));

  constructor() {
    super();
    this.ready = false;
  }

  override render() {
    return this.ready ? html`<dialog><p>Loaded</p></dialog>` : html`<p>Loading</p>`;
  }
}
customElements.define('test-late-dialog', TestLateDialog);

async function mountListbox(): Promise<TestListbox> {
  const element = new TestListbox();
  element.options = [{ label: 'Apple' }, { label: 'Banana' }];
  document.body.append(element);
  await element.updateComplete;
  await element.updateComplete;
  return element;
}

const optionsOf = (element: TestListbox): HTMLElement[] => [
  ...element.renderRoot.querySelectorAll<HTMLElement>('[part=option]'),
];

describe('lit adapter', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('exposes state before the first render and attaches after it', async () => {
    const element = new TestListbox();
    element.options = [{ label: 'Apple' }];
    document.body.append(element);
    expect(element.listbox?.state.items).to.deep.equal([]);
    await element.updateComplete;
    await element.updateComplete;
    expect(element.listbox?.state.items.map((item) => item.label)).to.deep.equal(['Apple']);
    expect(optionsOf(element)[0]?.getAttribute('role')).to.equal('option');
  });

  it('requests an update when state changes', async () => {
    const element = await mountListbox();
    let updates = 0;
    element.addController({ hostUpdate: () => (updates += 1) });
    element.listbox?.state.moveNext();
    await element.updateComplete;
    expect(updates).to.equal(1);
  });

  it('syncs new options after an update', async () => {
    const element = await mountListbox();
    element.options = [...element.options, { label: 'Cherry' }];
    await element.updateComplete;
    expect(optionsOf(element).map((o) => o.getAttribute('role'))).to.deep.equal(['option', 'option', 'option']);
    expect(element.listbox?.state.items).to.have.length(3);
  });

  it('disposes on disconnect and keeps state across reconnect', async () => {
    const element = await mountListbox();
    element.listbox?.state.moveNext();
    element.listbox?.state.selectActive();
    element.remove();
    expect(optionsOf(element)[1]?.hasAttribute('aria-selected')).to.equal(false);
    document.body.append(element);
    await element.updateComplete;
    expect(optionsOf(element)[1]?.getAttribute('aria-selected')).to.equal('true');
  });

  it('attaches once a conditionally rendered element appears, and rebinds when it is replaced', async () => {
    const element = new TestLateDialog();
    document.body.append(element);
    await element.updateComplete;
    element.ready = true;
    await element.updateComplete;
    const first = element.renderRoot.querySelector('dialog');
    element.dialog.state.show();
    expect(first?.open).to.equal(true);
    element.dialog.state.close();
    element.ready = false;
    await element.updateComplete;
    element.ready = true;
    await element.updateComplete;
    const second = element.renderRoot.querySelector('dialog');
    expect(second).not.to.equal(first);
    element.dialog.state.show();
    expect(second?.open).to.equal(true);
    element.dialog.state.close();
  });
});
