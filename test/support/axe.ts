import 'axe-core/axe.min.js';
import { expect } from 'chai';

declare global {
  interface Window {
    axe: typeof import('axe-core');
  }
}

/** Fails with the list of WCAG 2.2 A/AA violations inside the outermost shadow host containing `element`. */
export async function expectNoAxeViolations(element: Element): Promise<void> {
  let context: Element = element;
  for (let root = context.getRootNode(); root instanceof ShadowRoot; root = context.getRootNode()) {
    context = root.host;
  }
  const results = await window.axe.run(context, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
  });
  const violations = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`);
  expect(violations).to.deep.equal([]);
}
