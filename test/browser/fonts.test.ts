import { expect } from 'chai';
import '../../src/components/define/all.ts';
import type { MbButton } from '../../src/components/index.ts';
import { loadTokens, mount, part } from '../support/components.ts';

const fontsUrl = new URL('../../src/tokens/fonts.css', import.meta.url).href;

describe('fonts.css', () => {
  before(async () => {
    await loadTokens();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontsUrl;
    const loaded = new Promise((resolve, reject) => {
      link.addEventListener('load', resolve);
      link.addEventListener('error', reject);
    });
    document.head.append(link);
    await loaded;
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('loads Geist at the weights the skin uses', async () => {
    for (const weight of [300, 400, 500, 700]) {
      const faces = await document.fonts.load(`${weight} 16px Geist`);
      expect(faces.length, `weight ${weight}`).to.be.greaterThan(0);
    }
  });

  it('components ask for Aeonik first, then Geist', async () => {
    const { element } = await mount<MbButton>('<mb-button>Go</mb-button>');
    expect(getComputedStyle(part(element, 'base')).fontFamily).to.match(/^"?Aeonik"?, "?Geist"?,/);
  });
});
