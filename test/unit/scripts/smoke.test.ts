import { describe, expect, it } from 'vitest';
import { storyIds, verdict } from '../../../scripts/lib/smoke.js';

const run = (id: string, theme: string, error: string | null = null) => ({ id, theme, error });

describe('storyIds', () => {
  it('lists stories and skips docs pages', () => {
    const index = {
      v: 5,
      entries: {
        'intro--docs': { id: 'intro--docs', type: 'docs' },
        'a--one': { id: 'a--one', type: 'story' },
        'a--docs': { id: 'a--docs', type: 'docs' },
        'b--two': { id: 'b--two', type: 'story' },
      },
    };
    expect(storyIds(index)).toEqual(['a--one', 'b--two']);
  });
});

describe('verdict', () => {
  it('passes when every run passes', () => {
    expect(verdict([run('a', 'light'), run('a', 'dark')])).toEqual({ ok: true, problems: [] });
  });

  it('fails with each failed run', () => {
    expect(verdict([run('a', 'light'), run('a', 'dark', 'axe: button-name (1)')])).toEqual({
      ok: false,
      problems: ['a [dark]: axe: button-name (1)'],
    });
  });

  it('fails when there are no stories', () => {
    expect(verdict([])).toEqual({ ok: false, problems: ['no stories found'] });
  });

  it('passes when the expected stories fail in every run and the others pass', () => {
    const runs = [run('bad', 'light', 'page error: x'), run('bad', 'dark', 'page error: x'), run('good', 'light')];
    expect(verdict(runs, ['bad']).ok).toBe(true);
  });

  it('fails when an expected story passes in any run, or is missing', () => {
    const runs = [run('bad', 'light', 'page error: x'), run('bad', 'dark')];
    expect(verdict(runs, ['bad', 'gone'])).toEqual({
      ok: false,
      problems: ['bad [dark] passed but was expected to fail', 'gone was expected to fail but is not in the build'],
    });
  });
});
