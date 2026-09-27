import type { LitElement } from 'lit';

/** Waits until every Lit element under `root` (including shadow roots) has finished updating. */
export async function settle(root: ParentNode): Promise<void> {
  for (let pass = 0; pass < 3; pass++) {
    const elements = [...root.querySelectorAll('*')].filter(
      (element): element is LitElement => 'updateComplete' in element,
    );
    await Promise.all(elements.map((element) => element.updateComplete));
    for (const element of elements) if (element.shadowRoot) await settle(element.shadowRoot);
  }
}

/** Appends `markup` in a container at the end of `document.body` and waits for it to render. */
export async function mount<T extends Element>(markup: string): Promise<{ element: T; container: HTMLElement }> {
  const container = document.createElement('div');
  container.innerHTML = markup;
  document.body.append(container);
  await settle(container);
  const element = container.firstElementChild;
  if (element === null) throw new Error('nothing mounted');
  return { element: element as T, container };
}

/** The element's shadow part, or an error. */
export function part<T extends Element = HTMLElement>(host: Element, name: string): T {
  const found = host.shadowRoot?.querySelector<T & Element>(`[part~='${name}']`);
  if (!found) throw new Error(`no part ${name}`);
  return found;
}

/** The computed `rgb()` color of a custom property, resolved on a probe element. */
export function resolveColor(token: string, within: Element = document.body): string {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  within.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

/** The computed `px` length of a custom property, resolved on a probe element. */
export function resolveLength(token: string, within: Element = document.body): string {
  const probe = document.createElement('div');
  probe.style.width = `var(${token})`;
  within.append(probe);
  const width = getComputedStyle(probe).width;
  probe.remove();
  return width;
}

const noMotion =
  ':root, [data-theme] { --mb-motion-duration-fast: 0ms; --mb-motion-duration-medium: 0ms; --mb-motion-duration-slow: 0ms; }';

/** Turns motion on or off for the page. Off, every transition ends at once, so tests see end states. */
export function setMotion(enabled: boolean): void {
  const existing = document.querySelector('style[data-no-motion]');
  if (enabled) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const style = document.createElement('style');
  style.dataset['noMotion'] = '';
  style.textContent = noMotion;
  document.head.append(style);
}

/** Loads src/tokens/tokens.css once. */
export async function loadTokens(): Promise<void> {
  if (document.querySelector('link[data-tokens]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('../../src/tokens/tokens.css', import.meta.url).href;
  link.dataset['tokens'] = '';
  const loaded = new Promise((resolve) => link.addEventListener('load', resolve));
  document.head.append(link);
  await loaded;
  setMotion(false);
}
