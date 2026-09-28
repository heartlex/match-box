import { describe, expect, it } from 'vitest';
import { flipKeyframes } from '../../../src/motion/flip.ts';

const rect = (left: number, top: number, width = 100, height = 40) => ({ left, top, width, height });

describe('flipKeyframes', () => {
  it('translates from the last rect back to the first', () => {
    expect(flipKeyframes(rect(0, 0), rect(10, 40), true)).toEqual([
      { transformOrigin: '0 0', transform: 'translate(-10px, -40px)' },
      { transformOrigin: '0 0', transform: 'none' },
    ]);
  });

  it('scales when the size changed, unless scale is false', () => {
    expect(flipKeyframes(rect(0, 0, 100, 40), rect(0, 0, 200, 80), true)?.[0].transform).toBe(
      'translate(0px, 0px) scale(0.5, 0.5)',
    );
    expect(flipKeyframes(rect(0, 0, 100, 40), rect(0, 0, 200, 80), false)).toBeNull();
  });

  it('only translates when either rect has no size', () => {
    expect(flipKeyframes(rect(0, 0, 0, 0), rect(5, 5, 100, 40), true)?.[0].transform).toBe('translate(-5px, -5px)');
  });

  it('returns null for no change or sub-pixel noise', () => {
    expect(flipKeyframes(rect(0, 0), rect(0, 0), true)).toBeNull();
    expect(flipKeyframes(rect(0, 0), rect(0.2, 0.3, 100.01, 40), true)).toBeNull();
  });
});
