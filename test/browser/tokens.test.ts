import { expect } from 'chai';
import { emulateMedia } from '@web/test-runner-commands';

const tokensUrl = new URL('../../src/tokens/tokens.css', import.meta.url).href;
let sheet: CSSStyleSheet;

type Block = Map<string, string>;

function styleRules(rules: CSSRuleList): CSSStyleRule[] {
  return [...rules].flatMap((rule) => {
    if (rule instanceof CSSStyleRule) return [rule];
    if (rule instanceof CSSMediaRule) return styleRules(rule.cssRules);
    return [];
  });
}

/** Custom properties declared by the rule with `selector`, including rules inside @media. */
function block(selector: string): Block {
  const rule = styleRules(sheet.cssRules).find((r) => r.selectorText === selector);
  if (rule === undefined) throw new Error(`no rule for ${selector}`);
  const declared: Block = new Map();
  for (const name of rule.style) {
    if (name.startsWith('--')) declared.set(name, rule.style.getPropertyValue(name).trim());
  }
  return declared;
}

function token(name: string, element: Element = document.documentElement): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (high + 0.05) / (low + 0.05);
}

const textPairs = [
  ['--mb-color-fg-default', '--mb-color-bg-surface'],
  ['--mb-color-fg-default', '--mb-color-bg-canvas'],
  ['--mb-color-fg-muted', '--mb-color-bg-surface'],
  ['--mb-color-fg-subtle', '--mb-color-bg-surface'],
  ['--mb-color-fg-accent', '--mb-color-bg-surface'],
  ['--mb-color-fg-danger', '--mb-color-bg-surface'],
  ['--mb-color-fg-success', '--mb-color-bg-surface'],
  ['--mb-color-fg-on-accent', '--mb-color-bg-accent'],
  ['--mb-color-fg-on-accent', '--mb-color-bg-danger'],
] as const;

const nonTextPairs = [
  ['--mb-color-border-focus', '--mb-color-bg-surface'],
  ['--mb-color-border-strong', '--mb-color-bg-surface'],
] as const;

describe('tokens.css', () => {
  before(async () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = tokensUrl;
    const loaded = new Promise((resolve) => link.addEventListener('load', resolve));
    document.head.append(link);
    await loaded;
    sheet = link.sheet as CSSStyleSheet;
  });

  afterEach(async () => {
    document.documentElement.removeAttribute('data-theme');
    document.body.replaceChildren();
    await emulateMedia({ colorScheme: 'light' });
  });

  it('prefixes every custom property with --mb-', () => {
    const names = styleRules(sheet.cssRules).flatMap((rule) => [...rule.style].filter((n) => n.startsWith('--')));
    expect(names.length).to.be.greaterThan(60);
    for (const name of names) expect(name).to.match(/^--mb-/);
  });

  it('names semantic tokens category-role-modifier in lowercase', () => {
    for (const name of block(':root, [data-theme="light"]').keys()) {
      expect(name).to.match(/^--mb-[a-z]+(-[a-z0-9]+)+$/);
    }
  });

  it('dark blocks override exactly the color and shadow tokens, identically', () => {
    const light = block(':root, [data-theme="light"]');
    const dark = block('[data-theme="dark"]');
    const media = block(':root:not([data-theme="light"])');
    const themed = [...light.keys()].filter((name) => /^--mb-(color|shadow)-/.test(name));
    expect([...dark.keys()].sort()).to.deep.equal(themed.sort());
    expect([...media.entries()]).to.deep.equal([...dark.entries()]);
  });

  it('semantic tokens reference only primitives', () => {
    const primitives = block(':root');
    for (const [name, value] of [...block(':root, [data-theme="light"]'), ...block('[data-theme="dark"]')]) {
      for (const [, referenced] of value.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
        expect(primitives.has(referenced), `${name} references ${referenced}`).to.equal(true);
      }
    }
  });

  it('applies light values by default and dark values under data-theme="dark"', () => {
    expect(token('--mb-color-bg-surface')).to.equal('#ffffff');
    const subtree = document.createElement('div');
    subtree.dataset['theme'] = 'dark';
    document.body.append(subtree);
    expect(token('--mb-color-bg-surface', subtree)).to.equal('#18181b');
  });

  it('follows the system dark preference unless light is forced', async () => {
    await emulateMedia({ colorScheme: 'dark' });
    expect(token('--mb-color-bg-surface')).to.equal('#18181b');
    document.documentElement.dataset['theme'] = 'light';
    expect(token('--mb-color-bg-surface')).to.equal('#ffffff');
  });

  it('a light subtree inside a dark page gets light values', async () => {
    await emulateMedia({ colorScheme: 'dark' });
    const subtree = document.createElement('div');
    subtree.dataset['theme'] = 'light';
    document.body.append(subtree);
    expect(token('--mb-color-bg-surface', subtree)).to.equal('#ffffff');
  });

  for (const theme of ['light', 'dark']) {
    it(`meets WCAG AA contrast in the ${theme} theme`, () => {
      document.documentElement.dataset['theme'] = theme;
      for (const [fg, bg] of textPairs) {
        expect(contrast(token(fg), token(bg)), `${fg} on ${bg}`).to.be.at.least(4.5);
      }
      for (const [fg, bg] of nonTextPairs) {
        expect(contrast(token(fg), token(bg)), `${fg} on ${bg}`).to.be.at.least(3);
      }
    });
  }
});
