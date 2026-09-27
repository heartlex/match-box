export type Politeness = 'polite' | 'assertive';

let region: HTMLElement | undefined;

function liveRegion(): HTMLElement {
  if (region?.isConnected) return region;
  region = document.createElement('div');
  region.setAttribute('data-mb-live-region', '');
  region.setAttribute('aria-atomic', 'true');
  Object.assign(region.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    padding: '0',
    border: '0',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  });
  document.body.append(region);
  return region;
}

/**
 * Announces `message` through one shared live region, created on first use.
 * Resolves once the message is in the region.
 */
export function announce(message: string, politeness: Politeness = 'polite'): Promise<void> {
  const target = liveRegion();
  target.setAttribute('aria-live', politeness);
  target.textContent = '';
  // A pause between clearing and writing makes screen readers repeat identical messages.
  return new Promise((resolve) => {
    setTimeout(() => {
      target.textContent = message;
      resolve();
    }, 100);
  });
}
