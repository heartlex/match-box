import { expect } from 'chai';
import { emulateMedia } from '@web/test-runner-commands';
import '../../../src/components/define/all.ts';
import { colorRoles, MbButton, type MbListbox } from '../../../src/components/index.ts';
import { define } from '../../../src/components/shared/define.ts';
import { expectNoAxeViolations } from '../../support/axe.ts';
import { loadTokens, mount, part, resolveColor, settle } from '../../support/components.ts';

const transparent = 'rgba(0, 0, 0, 0)';
const variants = ['default', 'outline', 'ghost'] as const;

describe('styling contract', () => {
  before(loadTokens);

  afterEach(async () => {
    document.body.replaceChildren();
    document.documentElement.removeAttribute('data-theme');
    await emulateMedia({ forcedColors: 'none' });
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

  it('define is safe to call again for a registered tag', () => {
    expect(() => {
      define('mb-button', class extends MbButton {});
    }).not.to.throw();
    expect(customElements.get('mb-button')).to.equal(MbButton);
  });
});
