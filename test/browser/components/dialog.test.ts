import { expect } from 'chai';
import { sendKeys } from '@web/test-runner-commands';
import '../../../src/components/define/dialog.ts';
import type { MbDialog } from '../../../src/components/index.ts';
import { loadTokens, mount, part, settle } from '../../support/components.ts';
import { driver } from '../../support/driver.ts';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

async function mountDialog(attributes = '', content = '<p>Body</p>'): Promise<MbDialog> {
  const { element } = await mount<MbDialog>(`<mb-dialog label="Confirm" ${attributes}>${content}</mb-dialog>`);
  return element;
}

describe('mb-dialog', () => {
  before(loadTokens);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('show() opens it modally, reflects open, and sets :state(open)', async () => {
    const dialog = await mountDialog();
    dialog.show();
    await settle(document.body);
    expect(part<HTMLDialogElement>(dialog, 'dialog').matches(':modal')).to.equal(true);
    expect(dialog.hasAttribute('open')).to.equal(true);
    expect(dialog.matches(':state(open)')).to.equal(true);
  });

  it('opens from the open attribute', async () => {
    const dialog = await mountDialog('open');
    expect(part<HTMLDialogElement>(dialog, 'dialog').open).to.equal(true);
    dialog.close();
  });

  it('close(value) closes, sets returnValue, and fires close from the host', async () => {
    const dialog = await mountDialog();
    const events: string[] = [];
    const closed = new Promise((resolve) => dialog.addEventListener('close', resolve, { once: true }));
    dialog.addEventListener('close', () => events.push('close'));
    dialog.show();
    dialog.close('saved');
    await closed;
    expect([dialog.open, dialog.returnValue, events]).to.deep.equal([false, 'saved', ['close']]);
  });

  it('a slotted form with method="dialog" closes it with the submitter value', async () => {
    const dialog = await mountDialog('', '<form method="dialog" slot="footer"><button value="confirm">OK</button></form>');
    dialog.show();
    (dialog.querySelector('button') as HTMLButtonElement).click();
    await tick();
    expect([dialog.open, dialog.returnValue]).to.deep.equal([false, 'confirm']);
  });

  it('Escape fires cancel from the host, and preventing it keeps the dialog open', async () => {
    const dialog = await mountDialog();
    dialog.addEventListener('cancel', (event) => event.preventDefault());
    dialog.show();
    await settle(document.body);
    // Browsers honor a prevented cancel only after a user activation.
    await driver.click(part(dialog, 'body'));
    await sendKeys({ press: 'Escape' });
    await tick();
    expect(dialog.open).to.equal(true);
    dialog.close();
  });

  it('persistent ignores outside clicks until it is removed', async () => {
    const dialog = await mountDialog('persistent');
    dialog.show();
    await settle(document.body);
    await driver.click({ x: 2, y: 2 });
    await tick();
    expect(dialog.open).to.equal(true);
    dialog.persistent = false;
    await settle(document.body);
    await driver.click({ x: 2, y: 2 });
    await tick();
    expect(dialog.open).to.equal(false);
  });

  it('the close button is named by close-label and closes the dialog', async () => {
    const dialog = await mountDialog('close-label="Dismiss"');
    dialog.show();
    await settle(document.body);
    const close = part(dialog, 'close-button');
    expect(close.textContent?.trim()).to.equal('Dismiss');
    await driver.click(close);
    await tick();
    expect(dialog.open).to.equal(false);
  });

  it('the heading slot replaces the label, and the footer hides when empty', async () => {
    const dialog = await mountDialog('', '<span slot="heading">Custom title</span>');
    const title = part(dialog, 'title');
    const slot = title.querySelector('slot') as HTMLSlotElement;
    expect(slot.assignedNodes()[0]?.textContent).to.equal('Custom title');
    expect(part(dialog, 'footer').hidden).to.equal(true);
  });

  it('stays modal when moved while open', async () => {
    const dialog = await mountDialog();
    dialog.show();
    await settle(document.body);
    const other = document.createElement('div');
    document.body.append(other);
    other.append(dialog);
    await settle(document.body);
    expect(part<HTMLDialogElement>(dialog, 'dialog').matches(':modal')).to.equal(true);
    dialog.close();
  });
});
