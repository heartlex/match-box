// Fails when a generated page links outside the site's path prefix.
// Usage: node scripts/check-site-prefix.js <dir> <prefix>
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { findUnprefixed } from './lib/site-prefix.js';

const [dir, prefix] = process.argv.slice(2);
if (!dir || !prefix) {
  console.error('usage: node scripts/check-site-prefix.js <dir> <prefix>');
  process.exit(2);
}

let failed = false;
for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const file = join(entry.parentPath, entry.name);
  for (const url of findUnprefixed(readFileSync(file, 'utf8'), prefix)) {
    failed = true;
    console.log(`${relative(dir, file)}: ${url}`);
  }
}
if (failed) process.exit(1);
console.log(`ok   every local URL in ${dir} starts with ${prefix}`);
