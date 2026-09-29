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

const roles = ['neutral', 'primary', 'secondary', 'tertiary', 'danger'] as const;
const roleTokens = ['solid', 'solid-hover', 'solid-active', 'on-solid', 'text', 'subtle', 'subtle-active', 'border'] as const;

const statuses = ['success', 'warning', 'danger'] as const;

const textPairs: [string, string][] = [
  ['--mb-color-fg-default', '--mb-color-bg-surface'],
  ['--mb-color-fg-default', '--mb-color-bg-canvas'],
  ['--mb-color-fg-muted', '--mb-color-bg-surface'],
  ['--mb-color-fg-subtle', '--mb-color-bg-surface'],
  ...statuses.flatMap((status): [string, string][] => [
    [`--mb-color-fg-${status}`, '--mb-color-bg-surface'],
    [`--mb-color-fg-${status}`, `--mb-color-bg-${status}`],
  ]),
  ...roles.flatMap((role): [string, string][] => [
    [`--mb-color-${role}-on-solid`, `--mb-color-${role}-solid`],
    [`--mb-color-${role}-on-solid`, `--mb-color-${role}-solid-hover`],
    [`--mb-color-${role}-on-solid`, `--mb-color-${role}-solid-active`],
    [`--mb-color-${role}-text`, '--mb-color-bg-surface'],
    [`--mb-color-${role}-text`, `--mb-color-${role}-subtle`],
    [`--mb-color-${role}-text`, `--mb-color-${role}-subtle-active`],
  ]),
];

const nonTextPairs: [string, string][] = [
  ['--mb-color-border-focus', '--mb-color-bg-surface'],
  ['--mb-color-border-strong', '--mb-color-bg-surface'],
  ...roles.map((role): [string, string] => [`--mb-color-${role}-border`, '--mb-color-bg-surface']),
  ...roles.map((role): [string, string] => [`--mb-color-${role}-border`, '--mb-color-bg-surface-raised']),
];

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
    await emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
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

  it('defines eight tokens for each of the five color roles in both themes', () => {
    const expected = roles.flatMap((role) => roleTokens.map((name) => `--mb-color-${role}-${name}`));
    const light = [...block(':root, [data-theme="light"]').keys()];
    const dark = [...block('[data-theme="dark"]').keys()];
    for (const name of expected) {
      expect(light, `light ${name}`).to.include(name);
      expect(dark, `dark ${name}`).to.include(name);
    }
    const declared = [...light, ...dark].filter((name) => /^--mb-color-(neutral|primary|secondary|tertiary|danger)-/.test(name));
    expect(declared.length).to.equal(expected.length * 2);
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
    expect(token('--mb-color-bg-surface', subtree)).to.equal('#17173f');
  });

  it('follows the system dark preference unless light is forced', async () => {
    await emulateMedia({ colorScheme: 'dark' });
    expect(token('--mb-color-bg-surface')).to.equal('#17173f');
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
    it(`neutral fills stand apart from raised surfaces such as dialogs in the ${theme} theme`, () => {
      document.documentElement.dataset['theme'] = theme;
      const raised = token('--mb-color-bg-surface-raised');
      expect(token('--mb-color-neutral-solid'), 'neutral solid').not.to.equal(raised);
      expect(token('--mb-color-neutral-subtle'), 'neutral subtle').not.to.equal(raised);
    });

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

  it('defines five tokens for each of the three sizes, and a dialog width per size', () => {
    const light = block(':root, [data-theme="light"]');
    for (const size of ['sm', 'md', 'lg']) {
      for (const name of ['height', 'padding-inline', 'font-size', 'gap', 'icon']) {
        expect(light.has(`--mb-size-${size}-${name}`), `--mb-size-${size}-${name}`).to.equal(true);
      }
      expect(light.has(`--mb-dialog-width-${size}`), `--mb-dialog-width-${size}`).to.equal(true);
    }
  });

  it('sets the md size to the matchbox metrics', () => {
    expect(token('--mb-size-md-height')).to.equal('2.5rem');
    expect(token('--mb-size-md-padding-inline')).to.equal('1.5rem');
    expect(token('--mb-size-md-font-size')).to.equal('0.875rem');
    expect(token('--mb-size-md-gap')).to.equal('0.5rem');
    expect(token('--mb-dialog-width-md')).to.equal('32rem');
  });

  it('starts the body font stack with Aeonik, then Geist', () => {
    expect(token('--mb-font-family-body')).to.match(/^['"]Aeonik['"], ['"]Geist['"], system-ui/);
  });

  it('turns every motion duration to 0ms under reduced motion, in themed subtrees too', async () => {
    const subtree = document.createElement('div');
    subtree.dataset['theme'] = 'light';
    document.body.append(subtree);
    const durations = ['fast', 'medium', 'slow'].map((name) => `--mb-motion-duration-${name}`);
    expect(durations.map((name) => token(name))).to.deep.equal(['120ms', '200ms', '300ms']);
    await emulateMedia({ reducedMotion: 'reduce' });
    expect(durations.map((name) => token(name))).to.deep.equal(['0ms', '0ms', '0ms']);
    expect(durations.map((name) => token(name, subtree))).to.deep.equal(['0ms', '0ms', '0ms']);
  });
});
