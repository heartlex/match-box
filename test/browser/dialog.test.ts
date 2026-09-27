import { expect } from 'chai';
import { sendMouse } from '@web/test-runner-commands';
import { attachDialog } from '../../src/core/dom/index.ts';
import { dialogConformance } from '../../src/core/testing/index.ts';
import { mountPlainDialog } from '../skin/plain/dialog.ts';
import { expectNoAxeViolations } from '../support/axe.ts';
import { driver } from '../support/driver.ts';

dialogConformance({ name: 'plain', mount: mountPlainDialog, driver, audit: expectNoAxeViolations });

describe('attachDialog', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('attachDialog does not close when a drag starts inside and ends outside', async () => {
    const dialog = document.createElement('dialog');
    dialog.innerHTML = '<p>Drag from here</p>';
    document.body.append(dialog);
    const behavior = attachDialog({ dialog });
    behavior.state.show();
    const box = (dialog.querySelector('p') as HTMLElement).getBoundingClientRect();
    await sendMouse({ type: 'move', position: [Math.round(box.left + 2), Math.round(box.top + 2)] });
    await sendMouse({ type: 'down' });
    await sendMouse({ type: 'move', position: [2, 2] });
    await sendMouse({ type: 'up' });
    expect(dialog.open).to.equal(true);
    behavior.state.close();
  });

  it('attachDialog survives reopening before the queued close event runs', async () => {
    const dialog = document.createElement('dialog');
    document.body.append(dialog);
    const behavior = attachDialog({ dialog });
    behavior.state.show();
    behavior.state.close('first');
    behavior.state.show();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(behavior.state.open).to.equal(true);
    expect(dialog.open).to.equal(true);
    behavior.state.close();
  });

  it('a dismissal after a confirm does not report the old return value', async () => {
    const dialog = document.createElement('dialog');
    dialog.innerHTML = '<p>Body</p>';
    document.body.append(dialog);
    const behavior = attachDialog({ dialog });
    behavior.state.show();
    behavior.state.close('confirm');
    behavior.state.show();
    await sendMouse({ type: 'click', position: [2, 2] });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(behavior.state.open).to.equal(false);
    expect(behavior.state.returnValue).to.equal('');
    expect(dialog.returnValue).to.equal('');
  });

  it('adopts a dialog opened natively, so sync keeps it open and outside click closes it', async () => {
    const dialog = document.createElement('dialog');
    dialog.innerHTML = '<p>Body</p>';
    document.body.append(dialog);
    const behavior = attachDialog({ dialog });
    dialog.showModal();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(behavior.state.open).to.equal(true);
    behavior.sync();
    expect(dialog.open).to.equal(true);
    await sendMouse({ type: 'click', position: [2, 2] });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(dialog.open).to.equal(false);
  });
});
