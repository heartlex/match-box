import { attachDisclosure } from '../../../src/core/dom/index.ts';
import type { DisclosureFixture } from '../../../src/core/testing/index.ts';

/** Minimal plain DOM disclosure: the smallest consumer of core/dom. */
export function mountPlainDisclosure(): DisclosureFixture {
  const container = document.createElement('div');
  container.innerHTML = '<button type="button">Details</button><div>Hidden content</div>';
  document.body.append(container);
  const [trigger, panel] = container.children as unknown as [HTMLButtonElement, HTMLDivElement];
  const behavior = attachDisclosure({ trigger, panel });
  const show = (): void => {
    panel.hidden = !behavior.state.expanded;
  };
  const unsubscribe = behavior.state.subscribe(show);
  show();
  return {
    trigger,
    panel,
    teardown() {
      unsubscribe();
      behavior.dispose();
      container.remove();
    },
  };
}

/** Like mountPlainDisclosure, but hides the panel with `visibility: hidden`, as mb-disclosure does. */
export function mountVisibilityDisclosure(): DisclosureFixture {
  const fixture = mountPlainDisclosure();
  const { trigger, panel } = fixture;
  const show = (): void => {
    panel.hidden = false;
    panel.style.visibility = trigger.getAttribute('aria-expanded') === 'true' ? '' : 'hidden';
  };
  const observer = new MutationObserver(show);
  observer.observe(trigger, { attributes: true, attributeFilter: ['aria-expanded'] });
  show();
  return {
    trigger,
    panel,
    teardown() {
      observer.disconnect();
      fixture.teardown();
    },
  };
}
