import { expect } from 'chai';
import { emulateMedia, sendKeys } from '@web/test-runner-commands';
import '../../../src/components/define/dialog.ts';
import type { MbDialog } from '../../../src/components/index.ts';
import { loadTokens, mount, part, setMotion, settle } from '../../support/components.ts';
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

  it('a submit mb-button in a method="dialog" form closes it with its value', async () => {
    const dialog = await mountDialog(
      '',
      '<form method="dialog" slot="footer"><mb-button type="submit" value="delete">Delete</mb-button></form>',
    );
    dialog.show();
    await settle(document.body);
    await driver.click(part(dialog.querySelector('mb-button') as HTMLElement, 'base'));
    await tick();
    expect([dialog.open, dialog.returnValue]).to.deep.equal([false, 'delete']);
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

  it('has a 16px radius, a 24px title, and a navy backdrop', async () => {
    const dialog = await mountDialog();
    dialog.show();
    await settle(document.body);
    const dialogPart = part<HTMLDialogElement>(dialog, 'dialog');
    expect(getComputedStyle(dialogPart).borderBottomLeftRadius).to.equal('16px');
    expect(getComputedStyle(part(dialog, 'title')).fontSize).to.equal('24px');
    expect(getComputedStyle(dialogPart, '::backdrop').backgroundColor).to.equal('rgba(14, 14, 48, 0.4)');
    dialog.close();
  });

  it('has the same 1px border on every side', async () => {
    const dialog = await mountDialog();
    dialog.show();
    await settle(document.body);
    const style = getComputedStyle(part(dialog, 'dialog'));
    const top = [style.borderTopWidth, style.borderTopColor];
    expect(top[0]).to.equal('1px');
    expect([style.borderBottomWidth, style.borderBottomColor]).to.deep.equal(top);
    dialog.close();
  });

  it('size sets the width from the dialog widths, and --mb-dialog-width wins', async () => {
    const widths: number[] = [];
    for (const attributes of ['size="sm"', '', 'size="lg"', 'size="sm" style="--mb-dialog-width: 20rem"']) {
      const dialog = await mountDialog(attributes);
      dialog.show();
      await settle(document.body);
      widths.push(part(dialog, 'dialog').getBoundingClientRect().width);
      dialog.close();
      document.body.replaceChildren();
    }
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const cap = window.innerWidth - 2 * rem;
    expect(widths).to.deep.equal([24 * rem, 32 * rem, Math.min(48 * rem, cap), 20 * rem]);
  });

  describe('motion', () => {
    before(() => setMotion(true));
    after(() => setMotion(false));
    afterEach(() => emulateMedia({ reducedMotion: 'no-preference' }));

    it('transitions opacity, scale, and the top layer with --mb-dialog-duration', async () => {
      const dialog = await mountDialog('style="--mb-dialog-duration: 123ms"');
      const style = getComputedStyle(part(dialog, 'dialog'));
      expect(style.transitionProperty.split(', ').slice(0, 2)).to.deep.equal(['opacity', 'transform']);
      expect(style.transitionDuration.split(', ')[0]).to.equal('0.123s');
    });

    it('still opens modally and closes with the submitter value', async () => {
      const dialog = await mountDialog('', '<form method="dialog" slot="footer"><button value="confirm">OK</button></form>');
      dialog.show();
      await settle(document.body);
      expect(part<HTMLDialogElement>(dialog, 'dialog').matches(':modal')).to.equal(true);
      const closed = new Promise((resolve) => dialog.addEventListener('close', resolve, { once: true }));
      (dialog.querySelector('button') as HTMLButtonElement).click();
      await closed;
      expect([dialog.open, dialog.returnValue]).to.deep.equal([false, 'confirm']);
    });

    it('has no transition duration under reduced motion', async () => {
      await emulateMedia({ reducedMotion: 'reduce' });
      const dialog = await mountDialog();
      expect(getComputedStyle(part(dialog, 'dialog')).transitionDuration.split(', ')[0]).to.equal('0s');
    });
  });
});
