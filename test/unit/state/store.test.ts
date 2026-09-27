import { describe, expect, it } from 'vitest';
import { Store } from '../../../src/core/state/index.ts';

class Counter extends Store {
  count = 0;

  increment(): void {
    this.count += 1;
    this.notify();
  }
}

describe('Store', () => {
  it('notifies subscribers synchronously and stops after unsubscribe', () => {
    const counter = new Counter();
    const seen: number[] = [];
    const unsubscribe = counter.subscribe(() => seen.push(counter.count));
    counter.increment();
    expect(seen).toEqual([1]);
    unsubscribe();
    counter.increment();
    expect(seen).toEqual([1]);
  });

  it('lets a listener unsubscribe another during notification without skipping it', () => {
    const counter = new Counter();
    const calls: string[] = [];
    let unsubscribeB = (): void => {};
    counter.subscribe(() => {
      calls.push('a');
      unsubscribeB();
    });
    unsubscribeB = counter.subscribe(() => calls.push('b'));
    counter.increment();
    counter.increment();
    expect(calls).toEqual(['a', 'b', 'a']);
  });
});
