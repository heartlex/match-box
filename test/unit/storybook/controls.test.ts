import { describe, expect, it } from 'vitest';
import type { Meta } from '@storybook/web-components-vite';
import accordion from '../../../stories/components/accordion.stories.ts';
import button from '../../../stories/components/button.stories.ts';
import checkbox from '../../../stories/components/checkbox.stories.ts';
import checkboxGroup from '../../../stories/components/checkbox-group.stories.ts';
import dialog from '../../../stories/components/dialog.stories.ts';
import disclosure from '../../../stories/components/disclosure.stories.ts';
import field from '../../../stories/components/field.stories.ts';
import input from '../../../stories/components/input.stories.ts';
import listbox from '../../../stories/components/listbox.stories.ts';
import toggle from '../../../stories/components/switch.stories.ts';

// Storybook adds a row for every manifest entry (fields, parts, CSS properties); a control
// that the render function ignores does nothing, so each meta shows exactly its args.
describe.each([
  ['accordion', accordion],
  ['button', button],
  ['checkbox', checkbox],
  ['checkbox-group', checkboxGroup],
  ['dialog', dialog],
  ['disclosure', disclosure],
  ['field', field],
  ['input', input],
  ['listbox', listbox],
  ['switch', toggle],
] as [string, Meta][])('%s stories', (_, meta) => {
  it('show a control for each arg the render uses, and no others', () => {
    const include = (meta.parameters?.['controls'] as { include?: string[] } | undefined)?.include;
    expect([...(include ?? [])].sort()).toEqual(Object.keys(meta.args ?? {}).sort());
  });
});
