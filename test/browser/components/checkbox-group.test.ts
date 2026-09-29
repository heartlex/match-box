import { expect } from 'chai';
import '../../../src/components/define/all.ts';
import type { MbCheckbox, MbCheckboxGroup } from '../../../src/components/index.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';

const items = '<mb-checkbox value="nuts">Nuts</mb-checkbox><mb-checkbox value="honey">Honey</mb-checkbox>';

async function mountGroup(attributes = '', children = items) {
  const { element: form } = await mount<HTMLFormElement>(
    `<form><mb-checkbox-group name="topping" aria-label="Toppings" ${attributes}>${children}</mb-checkbox-group></form>`,
  );
  return { form, group: form.querySelector('mb-checkbox-group') as MbCheckboxGroup };
}

const boxes = (group: MbCheckboxGroup): MbCheckbox[] => [...group.querySelectorAll('mb-checkbox')];

describe('mb-checkbox-group', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('submits one entry per checked child and ignores child names', async () => {
    const { form, group } = await mountGroup('', '<mb-checkbox value="nuts" name="x" checked>Nuts</mb-checkbox><mb-checkbox value="honey" checked>Honey</mb-checkbox>');
    await settle(document.body);
    expect(new FormData(form).getAll('topping')).to.deep.equal(['nuts', 'honey']);
    expect(new FormData(form).has('x')).to.equal(false);
    expect(group.values).to.deep.equal(['nuts', 'honey']);
  });

  it('sets values and reads them back', async () => {
    const { group } = await mountGroup();
    group.values = ['honey'];
    await settle(document.body);
    expect(boxes(group).map((box) => box.checked)).to.deep.equal([false, true]);
    expect(group.values).to.deep.equal(['honey']);
  });

  it('requires at least one when required', async () => {
    const { group } = await mountGroup('required');
    await settle(document.body);
    expect([group.validity.valueMissing, group.validationMessage]).to.deep.equal([true, 'Select at least one option.']);
    group.values = ['nuts'];
    await settle(document.body);
    expect(group.validity.valid).to.equal(true);
  });

  it('checkboxes added later join the group', async () => {
    const { form, group } = await mountGroup('select-all disabled');
    const late = document.createElement('mb-checkbox');
    late.value = 'seeds';
    late.textContent = 'Seeds';
    group.append(late);
    await settle(document.body);
    expect(late.groupDisabled).to.equal(true);
    group.disabled = false;
    await settle(document.body);
    group.values = ['seeds'];
    await settle(document.body);
    const selectAll = part<MbCheckbox>(group, 'select-all');
    expect(selectAll.indeterminate).to.equal(true);
    expect(new FormData(form).getAll('topping')).to.deep.equal(['seeds']);
  });

  it('passes size and color to children without their own', async () => {
    const { group } = await mountGroup('size="lg" color="primary"', '<mb-checkbox>A</mb-checkbox><mb-checkbox size="sm">B</mb-checkbox>');
    await settle(document.body);
    const [first, second] = boxes(group) as [MbCheckbox, MbCheckbox];
    expect([first.size, first.color, second.size]).to.deep.equal(['lg', 'primary', 'sm']);
  });

  // Controller ruling: disabled children are excluded from values, FormData, and "at least one".
  it('a checked, disabled child does not satisfy required and does not submit', async () => {
    const { form, group } = await mountGroup(
      'required',
      '<mb-checkbox value="nuts" checked disabled>Nuts</mb-checkbox><mb-checkbox value="honey">Honey</mb-checkbox>',
    );
    await settle(document.body);
    expect(group.values).to.deep.equal([]);
    expect(group.validity.valueMissing).to.equal(true);
    expect(new FormData(form).getAll('topping')).to.deep.equal([]);
  });

  // Fix round 1: state must not go stale on a change that is not a user `change`, a
  // slotchange, `values`, or a reset.
  it('a script-set child.checked updates FormData and validity', async () => {
    const { form, group } = await mountGroup('required');
    await settle(document.body);
    expect(group.validity.valueMissing).to.equal(true);
    const [nuts] = boxes(group);
    nuts.checked = true;
    await settle(document.body);
    expect(new FormData(form).getAll('topping')).to.deep.equal(['nuts']);
    expect(group.validity.valid).to.equal(true);
  });

  it('a child disabled after render keeps its checked state through select-all', async () => {
    const { group } = await mountGroup('select-all');
    const [nuts, honey] = boxes(group);
    nuts.disabled = true;
    await settle(document.body);
    const selectAll = part<MbCheckbox>(group, 'select-all');
    selectAll.click();
    await settle(document.body);
    expect(nuts.checked).to.equal(false);
    expect(honey.checked).to.equal(true);
  });

  it('a group disabled then re-enabled shows select-all checked and resubmits', async () => {
    const { form, group } = await mountGroup(
      'select-all disabled',
      '<mb-checkbox value="nuts" checked>Nuts</mb-checkbox><mb-checkbox value="honey" checked>Honey</mb-checkbox>',
    );
    await settle(document.body);
    group.disabled = false;
    await settle(document.body);
    const selectAll = part<MbCheckbox>(group, 'select-all');
    expect([selectAll.checked, selectAll.indeterminate]).to.deep.equal([true, false]);
    expect(new FormData(form).getAll('topping')).to.deep.equal(['nuts', 'honey']);
  });

  // Fix round 2: select-all must be correct after exactly one updateComplete, not a cycle later.
  it('shows select-all checked after exactly one updateComplete when a disabled group is re-enabled', async () => {
    const { group } = await mountGroup(
      'select-all',
      '<mb-checkbox value="nuts" checked>Nuts</mb-checkbox><mb-checkbox value="honey" checked>Honey</mb-checkbox>',
    );
    await settle(document.body);
    group.disabled = true;
    await group.updateComplete;
    group.disabled = false;
    await group.updateComplete;
    const selectAll = part<MbCheckbox>(group, 'select-all');
    const input = selectAll.shadowRoot?.querySelector('input') as HTMLInputElement;
    expect([input.checked, input.indeterminate]).to.deep.equal([true, false]);
  });

  it('shows select-all checked after exactly one updateComplete when an ancestor fieldset is re-enabled', async () => {
    const { element: form } = await mount<HTMLFormElement>(
      '<form><fieldset disabled><mb-checkbox-group name="topping" aria-label="Toppings" select-all>' +
        '<mb-checkbox value="nuts" checked>Nuts</mb-checkbox><mb-checkbox value="honey" checked>Honey</mb-checkbox>' +
        '</mb-checkbox-group></fieldset></form>',
    );
    const group = form.querySelector('mb-checkbox-group') as MbCheckboxGroup;
    await settle(document.body);
    const fieldset = form.querySelector('fieldset') as HTMLFieldSetElement;
    fieldset.disabled = false;
    await group.updateComplete;
    const selectAll = part<MbCheckbox>(group, 'select-all');
    const input = selectAll.shadowRoot?.querySelector('input') as HTMLInputElement;
    expect([input.checked, input.indeterminate]).to.deep.equal([true, false]);
  });

  it('changing a checked child value updates FormData', async () => {
    const { form, group } = await mountGroup(
      '',
      '<mb-checkbox value="nuts" checked>Nuts</mb-checkbox><mb-checkbox value="honey">Honey</mb-checkbox>',
    );
    await settle(document.body);
    const [nuts] = boxes(group);
    nuts.value = 'almonds';
    await settle(document.body);
    expect(new FormData(form).getAll('topping')).to.deep.equal(['almonds']);
  });
});
