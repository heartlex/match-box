// The pure parts of the Storybook smoke test: which stories to open, and whether a run passed.

/**
 * The ids of the stories in a Storybook `index.json`, skipping docs pages.
 * @param {{ entries: Record<string, { id: string, type: string }> }} index
 * @returns {string[]}
 */
export function storyIds(index) {
  return Object.values(index.entries)
    .filter((entry) => entry.type === 'story')
    .map((entry) => entry.id);
}

/**
 * Whether a smoke run passed. Without `expectFail`, every run must pass. With it,
 * each listed story must fail in every run and every other story must pass.
 * An empty run fails: a smoke test that checked nothing proves nothing.
 * @param {{ id: string, theme: string, error: string | null }[]} runs
 * @param {string[]} [expectFail]
 * @returns {{ ok: boolean, problems: string[] }}
 */
export function verdict(runs, expectFail = []) {
  if (runs.length === 0) return { ok: false, problems: ['no stories found'] };
  const problems = [];
  for (const run of runs) {
    const expected = expectFail.includes(run.id);
    if (expected && run.error === null) problems.push(`${run.id} [${run.theme}] passed but was expected to fail`);
    if (!expected && run.error !== null) problems.push(`${run.id} [${run.theme}]: ${run.error}`);
  }
  for (const id of expectFail) {
    if (!runs.some((run) => run.id === id)) problems.push(`${id} was expected to fail but is not in the build`);
  }
  return { ok: problems.length === 0, problems };
}
