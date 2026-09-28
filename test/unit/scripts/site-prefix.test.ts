import { describe, expect, it } from 'vitest';
import { findUnprefixed } from '../../../scripts/lib/site-prefix.js';

const prefix = '/match-box/';

describe('findUnprefixed', () => {
  it('flags root-relative href and src outside the prefix', () => {
    const html =
      '<a href="/theming/">T</a><script type="module" src="/pkg/all.js"></script><link href="/match-box/pkg/tokens.css">';
    expect(findUnprefixed(html, prefix)).toEqual(['/theming/', '/pkg/all.js']);
  });

  it('ignores external, protocol-relative, relative, anchor, and mailto URLs', () => {
    const html =
      '<a href="https://x.dev/">x</a><script src="//cdn.dev/a.js"></script><a href="../api/">r</a><a href="#top">t</a><a href="mailto:a@b.c">m</a>';
    expect(findUnprefixed(html, prefix)).toEqual([]);
  });

  it('flags import map entries outside the prefix', () => {
    const html =
      '<script type="importmap">{"imports":{"lit":"/vendor/lit/index.js","match-box/core":"/match-box/pkg/core/index.js"}}</script>';
    expect(findUnprefixed(html, prefix)).toEqual(['/vendor/lit/index.js']);
  });

  it('flags an absolute import in an inline module script', () => {
    const html = `<script type="module">
  import { mountListbox } from '/demos/demos.js';
  import 'match-box/motion';
  await import('/lazy.js');
</script>`;
    expect(findUnprefixed(html, prefix)).toEqual(['/demos/demos.js', '/lazy.js']);
  });

  it('ignores URLs shown in code samples', () => {
    const html =
      "<pre><code>&lt;mb-button href=&quot;/docs&quot;&gt;\nimport { mountListbox } from '/demos/demos.js';</code></pre>";
    expect(findUnprefixed(html, prefix)).toEqual([]);
  });

  it('accepts every root-relative URL when the prefix is /', () => {
    expect(findUnprefixed('<a href="/theming/">T</a>', '/')).toEqual([]);
  });
});
