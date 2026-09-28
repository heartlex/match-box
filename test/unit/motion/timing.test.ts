import { describe, expect, it } from 'vitest';
import { parseDuration } from '../../../src/motion/timing.ts';

describe('parseDuration', () => {
  it.each([
    ['200ms', 200],
    [' 0.3s ', 300],
    ['1.5ms', 1.5],
    ['.5s', 500],
    ['0ms', 0],
    ['0s', 0],
  ])('parses %j as %d', (value, expected) => {
    expect(parseDuration(value)).toBe(expected);
  });

  it.each(['', 'fast', '200', '-5ms', 'calc(1ms)', '1e3ms'])('returns 0 for %j', (value) => {
    expect(parseDuration(value)).toBe(0);
  });
});
