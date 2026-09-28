import { expect } from 'chai';
import { emulateMedia } from '@web/test-runner-commands';
import '../../../src/components/define/all.ts';
import { colorRoles, MbButton, sizes, type MbDialog, type MbListbox } from '../../../src/components/index.ts';
import { define } from '../../../src/components/shared/define.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part, resolveColor, setMotion, settle } from '../../support/components.ts';

const transparent = 'rgba(0, 0, 0, 0)';
const variants = ['default', 'outline', 'ghost'] as const;

describe('styling contract', () => {
  before(loadTokens);

  afterEach(async () => {
    document.body.replaceChildren();
    document.documentElement.removeAttribute('data-theme');
    await emulateMedia({ forcedColors: 'none' });
    await emulateMedia({ reducedMotion: 'no-preference' });
  });

  for (const role of colorRoles) {
    it(`mb-button uses the ${role} role tokens in each variant`, async () => {
      const { container } = await mount(
        variants.map((variant) => `<mb-button variant="${variant}" color="${role}">Go</mb-button>`).join(''),
      );
      const [solid, outline, ghost] = [...container.querySelectorAll('mb-button')].map((button) =>
        getComputedStyle(part(button, 'base')),
      ) as [CSSStyleDeclaration, CSSStyleDeclaration, CSSStyleDeclaration];
      expect(solid.backgroundColor, 'default background').to.equal(resolveColor(`--mb-color-${role}-solid`));
      expect(solid.color, 'default text').to.equal(resolveColor(`--mb-color-${role}-on-solid`));
      expect(outline.borderTopColor, 'outline border').to.equal(resolveColor(`--mb-color-${role}-border`));
      expect(outline.color, 'outline text').to.equal(resolveColor(`--mb-color-${role}-text`));
      expect(ghost.backgroundColor, 'ghost background').to.equal(transparent);
      expect(ghost.color, 'ghost text').to.equal(resolveColor(`--mb-color-${role}-text`));
    });

    it(`mb-listbox colors selected options with the ${role} role`, async () => {
      const { element } = await mount<MbListbox>(
        `<mb-listbox label="Fruit" color="${role}"><mb-option selected>Apple</mb-option></mb-listbox>`,
      );
      const base = getComputedStyle(part(element.querySelector('mb-option') as Element, 'base'));
      expect(base.backgroundColor).to.equal(resolveColor(`--mb-color-${role}-subtle`));
      expect(base.color).to.equal(resolveColor(`--mb-color-${role}-text`));
    });
  }

  it('follows the dark theme', async () => {
    document.documentElement.dataset['theme'] = 'dark';
    const { element } = await mount<MbButton>('<mb-button color="primary">Go</mb-button>');
    expect(getComputedStyle(part(element, 'base')).backgroundColor).to.equal(resolveColor('--mb-color-primary-solid'));
    expect(resolveColor('--mb-color-primary-solid')).to.equal('rgb(91, 147, 245)');
  });

  it('a component token set on an ancestor wins', async () => {
    const { container } = await mount('<div style="--mb-button-bg: rgb(1, 2, 3)"><mb-button>Go</mb-button></div>');
    const button = container.querySelector('mb-button') as MbButton;
    expect(getComputedStyle(part(button, 'base')).backgroundColor).to.equal('rgb(1, 2, 3)');
  });

  it('parts can be styled with ::part()', async () => {
    const style = document.createElement('style');
    style.textContent = 'mb-button.styled::part(base) { text-transform: uppercase; }';
    document.head.append(style);
    const { element } = await mount<MbButton>('<mb-button class="styled">Go</mb-button>');
    expect(getComputedStyle(part(element, 'base')).textTransform).to.equal('uppercase');
    style.remove();
  });

  it('keeps borders and selection visible in forced colors', async () => {
    await emulateMedia({ forcedColors: 'active' });
    const { container } = await mount(
      '<mb-button variant="ghost">Go</mb-button><mb-listbox label="Fruit"><mb-option selected>Apple</mb-option></mb-listbox>',
    );
    await settle(container);
    const button = container.querySelector('mb-button') as MbButton;
    const listbox = container.querySelector('mb-listbox') as MbListbox;
    expect(getComputedStyle(part(button, 'base')).borderTopStyle).to.equal('solid');
    expect(getComputedStyle(part(button, 'base')).borderTopColor).not.to.equal(transparent);
    const option = listbox.querySelector('mb-option') as Element;
    expect(getComputedStyle(part(option, 'base')).backgroundColor).not.to.equal(transparent);
  });

  for (const theme of ['light', 'dark']) {
    it(`every color and variant passes axe in the ${theme} theme`, async () => {
      document.documentElement.dataset['theme'] = theme;
      const buttons = colorRoles.flatMap((role) =>
        variants.map((variant) => `<mb-button variant="${variant}" color="${role}">${role} ${variant}</mb-button>`),
      );
      const listboxes = colorRoles.map(
        (role) => `<mb-listbox label="${role}" color="${role}"><mb-option selected>A</mb-option><mb-option>B</mb-option></mb-listbox>`,
      );
      const disclosures = colorRoles.map(
        (role) => `<mb-disclosure color="${role}" open><span slot="summary">${role}</span>Body</mb-disclosure>`,
      );
      // Components sit on the theme's surface, as they would on a themed page.
      const surface = 'background: var(--mb-color-bg-surface); color: var(--mb-color-fg-default)';
      const { container } = await mount(
        `<main style="${surface}">${[...buttons, ...listboxes, ...disclosures].join('')}</main>`,
      );
      await expectNoAxeViolations(container);
    });
  }

  for (const theme of ['light', 'dark']) {
    it(`every size, and link buttons, pass axe in the ${theme} theme`, async () => {
      document.documentElement.dataset['theme'] = theme;
      const markup = sizes.flatMap((size) => [
        `<mb-button size="${size}" color="primary">Save ${size}</mb-button>`,
        `<mb-button size="${size}" href="#docs" variant="outline">Docs ${size}</mb-button>`,
        `<mb-disclosure size="${size}" open><span slot="summary">${size}</span>Body</mb-disclosure>`,
        `<mb-listbox size="${size}" label="List ${size}" multiple><mb-option selected>A</mb-option><mb-option>B</mb-option></mb-listbox>`,
      ]);
      const surface = 'background: var(--mb-color-bg-surface); color: var(--mb-color-fg-default)';
      const { container } = await mount(`<main style="${surface}">${markup.join('')}</main>`);
      await expectNoAxeViolations(container);
    });
  }

  it('small controls are at least 24 by 24 pixels (WCAG 2.5.8)', async () => {
    const { container } = await mount(
      '<mb-button size="sm">A</mb-button><mb-disclosure size="sm"><span slot="summary">A</span>B</mb-disclosure>' +
        '<mb-listbox size="sm" label="L"><mb-option>A</mb-option></mb-listbox>',
    );
    const targets = [
      part(container.querySelector('mb-button') as Element, 'base'),
      part(container.querySelector('mb-disclosure') as Element, 'trigger'),
      part(container.querySelector('mb-option') as Element, 'base'),
    ];
    for (const target of targets) {
      const box = target.getBoundingClientRect();
      expect(Math.min(box.width, box.height), target.localName).to.be.at.least(24);
    }
  });

  it('every animation has no duration under reduced motion', async () => {
    setMotion(true);
    await emulateMedia({ reducedMotion: 'reduce' });
    const { container } = await mount(
      '<mb-button>A</mb-button><mb-disclosure><span slot="summary">A</span>B</mb-disclosure>' +
        '<mb-listbox label="L"><mb-option>A</mb-option></mb-listbox><mb-dialog label="D">Body</mb-dialog>',
    );
    const parts = [
      part(container.querySelector('mb-button') as Element, 'base'),
      part(container.querySelector('mb-disclosure') as Element, 'panel'),
      part(container.querySelector('mb-disclosure') as Element, 'icon'),
      part(container.querySelector('mb-option') as Element, 'base'),
      part(container.querySelector('mb-dialog') as MbDialog, 'dialog'),
    ];
    const durations = parts.flatMap((element) => getComputedStyle(element).transitionDuration.split(', '));
    setMotion(false);
    expect([...new Set(durations)]).to.deep.equal(['0s']);
  });

  it('define is safe to call again for a registered tag', () => {
    expect(() => {
      define('mb-button', class extends MbButton {});
    }).not.to.throw();
    expect(customElements.get('mb-button')).to.equal(MbButton);
  });
});
