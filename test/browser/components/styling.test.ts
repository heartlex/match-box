import { expect } from 'chai';
import { emulateMedia } from '@web/test-runner-commands';
import '../../../src/components/define/all.ts';
import {
  colorRoles,
  MbButton,
  sizes,
  type MbCheckbox,
  type MbDialog,
  type MbInput,
  type MbListbox,
} from '../../../src/components/index.ts';
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
      // mb-listbox borrows primary's accent for the neutral role (neutralAccent, Task 1/8), so a
      // listbox without a `color` tints its selection with the brand color; the text stays the
      // role's own (unaccented) text token, matching mb-checkbox and mb-switch below.
      const accentRole = role === 'neutral' ? 'primary' : role;
      expect(base.backgroundColor).to.equal(resolveColor(`--mb-color-${accentRole}-subtle`));
      expect(base.color).to.equal(resolveColor(`--mb-color-${role}-text`));
    });

    it(`mb-checkbox and mb-switch fill with the ${role} role when checked`, async () => {
      const { container } = await mount(
        `<mb-checkbox color="${role}" checked>A</mb-checkbox><mb-switch color="${role}" checked>B</mb-switch>`,
      );
      const box = getComputedStyle(part(container.querySelector('mb-checkbox') as Element, 'box'));
      const track = getComputedStyle(part(container.querySelector('mb-switch') as Element, 'track'));
      // Both mb-checkbox and mb-switch borrow primary's accent for the neutral role (neutralAccent,
      // Task 1/6/7), so a control without a `color` shows the brand color when checked.
      const accentRole = role === 'neutral' ? 'primary' : role;
      expect(box.backgroundColor).to.equal(resolveColor(`--mb-color-${accentRole}-solid`));
      expect(track.backgroundColor).to.equal(resolveColor(`--mb-color-${accentRole}-solid`));
    });
  }

  it('form control tokens set on an ancestor win', async () => {
    const { container } = await mount(
      '<div style="--mb-input-bg: rgb(1, 2, 3); --mb-checkbox-bg: rgb(4, 5, 6)"><mb-input aria-label="A"></mb-input><mb-checkbox>B</mb-checkbox></div>',
    );
    expect(getComputedStyle(part(container.querySelector('mb-input') as MbInput, 'base')).backgroundColor).to.equal('rgb(1, 2, 3)');
    expect(getComputedStyle(part(container.querySelector('mb-checkbox') as MbCheckbox, 'box')).backgroundColor).to.equal(
      'rgb(4, 5, 6)',
    );
  });

  it('page CSS does not leak inherited text properties into the form controls', async () => {
    // A page-wide `*, input, label, span { … }` rule can never reach into another
    // element's shadow tree, so it would only prove shadow DOM exists. The realistic
    // leak path is INHERITED properties set on the host (or its ancestors, or `:root`
    // and `body`, which `*` also matches): those cross into shadow DOM wherever a part
    // does not pin its own value.
    const { container } = await mount(
      '<mb-input aria-label="A"></mb-input><mb-checkbox>B</mb-checkbox><mb-switch>C</mb-switch>' +
        '<mb-field label="L"><mb-input></mb-input></mb-field>',
    );
    const targets = [
      part(container.querySelector('mb-input') as MbInput, 'base'),
      part(container.querySelector('mb-checkbox') as MbCheckbox, 'label'),
      part(container.querySelector('mb-switch') as Element, 'label'),
      part(container.querySelector('mb-field') as Element, 'label'),
    ];
    const properties = ['color', 'fontFamily', 'fontSize', 'lineHeight', 'letterSpacing'] as const;
    const read = (): string[][] =>
      targets.map((target) => properties.map((property) => getComputedStyle(target)[property]));
    const before = read();
    const hostile = document.createElement('style');
    // font-size is forced on every element EXCEPT :root: every size token in the skin is `rem`,
    // so forcing :root's own font-size would rescale the whole design system through the unit
    // itself (confirmed against mb-button's identical `var(--_font-size)` chain, already
    // reviewed sound) — a deliberate, accessibility-relevant characteristic (browsers/pages
    // resizing root text, per WCAG 1.4.4), not a shadow-DOM containment leak. Every other
    // property here has no such root-relative mechanism, so :root is still forced for them.
    hostile.textContent = `
      *, :root, body { color: rgb(0, 255, 0) !important; font-family: serif !important; line-height: 4 !important; letter-spacing: 3px !important; }
      *:not(:root) { font-size: 30px !important; }
    `;
    document.head.append(hostile);
    const after = read();
    hostile.remove();
    expect(after).to.deep.equal(before);
  });

  it('follows the dark theme', async () => {
    document.documentElement.dataset['theme'] = 'dark';
    const { element } = await mount<MbButton>('<mb-button color="primary">Go</mb-button>');
    expect(getComputedStyle(part(element, 'base')).backgroundColor).to.equal(resolveColor('--mb-color-primary-solid'));
    expect(resolveColor('--mb-color-primary-solid')).to.equal('rgb(123, 123, 255)');
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
      '<mb-button variant="ghost">Go</mb-button><mb-listbox label="Fruit"><mb-option selected>Apple</mb-option></mb-listbox>' +
        '<mb-checkbox checked>Check</mb-checkbox>',
    );
    await settle(container);
    const button = container.querySelector('mb-button') as MbButton;
    const listbox = container.querySelector('mb-listbox') as MbListbox;
    expect(getComputedStyle(part(button, 'base')).borderTopStyle).to.equal('solid');
    expect(getComputedStyle(part(button, 'base')).borderTopColor).not.to.equal(transparent);
    const option = listbox.querySelector('mb-option') as Element;
    expect(getComputedStyle(part(option, 'base')).backgroundColor).not.to.equal(transparent);
    // "not transparent, border >= 1px" holds in every mode, so it would still pass even if the
    // checked-state forced-colors rule regressed. Compare against the actual system colors instead,
    // read from probes evaluated in the same forced-colors mode.
    const checkbox = container.querySelector('mb-checkbox') as Element;
    const box = getComputedStyle(part(checkbox, 'box'));
    const mark = part(checkbox, 'mark');
    const highlightProbe = document.createElement('span');
    highlightProbe.style.backgroundColor = 'Highlight';
    document.body.append(highlightProbe);
    expect(box.backgroundColor).to.equal(getComputedStyle(highlightProbe).backgroundColor);
    highlightProbe.remove();
    const highlightTextProbe = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const highlightTextRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    highlightTextRect.style.stroke = 'HighlightText';
    highlightTextProbe.append(highlightTextRect);
    document.body.append(highlightTextProbe);
    expect(getComputedStyle(mark).stroke).to.equal(getComputedStyle(highlightTextRect).stroke);
    highlightTextProbe.remove();
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
        `<mb-field size="${size}" label="Email ${size}" description="Hint"><mb-input type="email"></mb-input></mb-field>`,
        `<mb-checkbox size="${size}" checked>Check ${size}</mb-checkbox>`,
        `<mb-switch size="${size}" checked>Switch ${size}</mb-switch>`,
        `<mb-field label="Group ${size}"><mb-checkbox-group size="${size}" select-all><mb-checkbox>A</mb-checkbox><mb-checkbox checked>B</mb-checkbox></mb-checkbox-group></mb-field>`,
      ]);
      const surface = 'background: var(--mb-color-bg-surface); color: var(--mb-color-fg-default)';
      const { container } = await mount(`<main style="${surface}">${markup.join('')}</main>`);
      await expectNoAxeViolations(container);
    });
  }

  it('small controls are at least 24 by 24 pixels (WCAG 2.5.8)', async () => {
    const { container } = await mount(
      '<mb-button size="sm">A</mb-button><mb-disclosure size="sm"><span slot="summary">A</span>B</mb-disclosure>' +
        '<mb-listbox size="sm" label="L"><mb-option>A</mb-option></mb-listbox>' +
        '<mb-input size="sm" aria-label="I"></mb-input><mb-checkbox size="sm">C</mb-checkbox><mb-switch size="sm">S</mb-switch>',
    );
    const targets = [
      part(container.querySelector('mb-button') as Element, 'base'),
      part(container.querySelector('mb-disclosure') as Element, 'trigger'),
      part(container.querySelector('mb-option') as Element, 'base'),
      part(container.querySelector('mb-input') as Element, 'base'),
      part(container.querySelector('mb-checkbox') as Element, 'base'),
      part(container.querySelector('mb-switch') as Element, 'base'),
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
        '<mb-listbox label="L"><mb-option>A</mb-option></mb-listbox><mb-dialog label="D">Body</mb-dialog>' +
        '<mb-input aria-label="I"></mb-input><mb-checkbox>C</mb-checkbox><mb-switch>S</mb-switch>',
    );
    const parts = [
      part(container.querySelector('mb-button') as Element, 'base'),
      part(container.querySelector('mb-disclosure') as Element, 'panel'),
      part(container.querySelector('mb-disclosure') as Element, 'icon'),
      part(container.querySelector('mb-option') as Element, 'base'),
      part(container.querySelector('mb-dialog') as MbDialog, 'dialog'),
      part(container.querySelector('mb-input') as Element, 'base'),
      part(container.querySelector('mb-checkbox') as Element, 'box'),
      part(container.querySelector('mb-switch') as Element, 'track'),
      part(container.querySelector('mb-switch') as Element, 'thumb'),
    ];
    const durations = parts.flatMap((element) => getComputedStyle(element).transitionDuration.split(', '));
    setMotion(false);
    expect([...new Set(durations)]).to.deep.equal(['0s']);
  });

  it('rounds controls 12px, checkbox boxes and the field error 6px, and the listbox panel like the accordion', async () => {
    const { container } = await mount(`
      <mb-button>Go</mb-button>
      <mb-input aria-label="A"></mb-input>
      <mb-checkbox>C</mb-checkbox>
      <mb-field label="F" error="Bad"><mb-input></mb-input></mb-field>
      <mb-listbox label="L" multiple><mb-option value="a" selected>A</mb-option></mb-listbox>
      <mb-accordion><mb-disclosure><span slot="summary">S</span>x</mb-disclosure></mb-accordion>
    `);
    const radius = (element: Element): string => getComputedStyle(element).borderTopLeftRadius;
    const one = <T extends Element>(selector: string): T => container.querySelector(selector) as T;
    const listbox = one<MbListbox>('mb-listbox');
    const option = listbox.querySelector('mb-option') as Element;
    expect(radius(part(one('mb-button'), 'base')), 'button').to.equal('12px');
    expect(radius(part(one('mb-input'), 'base')), 'input').to.equal('12px');
    expect(radius(part(option, 'base')), 'option').to.equal('12px');
    expect(radius(part(one('mb-checkbox'), 'box')), 'checkbox').to.equal('6px');
    expect(radius(part(option, 'check')), 'option check').to.equal('6px');
    expect(radius(part(one('mb-field'), 'error')), 'field error').to.equal('6px');
    expect(radius(part(listbox, 'listbox')), 'listbox panel').to.equal(radius(part(one('mb-accordion'), 'base')));
    expect(radius(part(listbox, 'listbox')), 'listbox panel').to.equal('16px');
  });

  it('define is safe to call again for a registered tag', () => {
    expect(() => {
      define('mb-button', class extends MbButton {});
    }).not.to.throw();
    expect(customElements.get('mb-button')).to.equal(MbButton);
  });
});
