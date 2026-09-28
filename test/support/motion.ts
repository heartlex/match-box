/** Resolves after the current task. */
export const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** Resolves once `condition` holds, checking every frame; rejects after `timeout` ms. */
export async function until(condition: () => boolean, timeout = 2000): Promise<void> {
  const start = performance.now();
  while (!condition()) {
    if (performance.now() - start > timeout) throw new Error('timed out waiting for a condition');
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

/** Whether `promise` is still pending after the current task. */
export async function isPending(promise: Promise<unknown>): Promise<boolean> {
  const pending = Symbol('pending');
  const settledValue = promise.then(
    () => 'settled',
    () => 'settled',
  );
  const result = await Promise.race([settledValue, tick().then(() => pending)]);
  return result === pending;
}

/** Counts calls to `Element.prototype.animate` until `restore()`. */
export function spyOnAnimate(): { count(): number; restore(): void } {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const original = Element.prototype.animate;
  let calls = 0;
  Element.prototype.animate = function (this: Element, ...args: Parameters<Element['animate']>): Animation {
    calls += 1;
    return original.apply(this, args);
  };
  return {
    count: () => calls,
    restore: () => {
      Element.prototype.animate = original;
    },
  };
}

/** The number in a computed `px` length. */
export const px = (value: string): number => Number.parseFloat(value);
