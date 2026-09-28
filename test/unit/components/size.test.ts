import { describe, expect, it } from 'vitest';
import { sizeName, sizes } from '../../../src/components/shared/size.ts';

describe('sizeName', () => {
  it('returns each size unchanged', () => {
    expect(sizes.map((size) => sizeName(size))).toEqual(['sm', 'md', 'lg']);
  });

  it.each([undefined, null, '', 'xl', 'SM'])('returns md for %s', (value) => {
    expect(sizeName(value)).toBe('md');
  });
});
