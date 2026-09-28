// Finds root-relative URLs in generated HTML that do not start with the site's path prefix.

const attribute = /\s(?:href|src)="([^"]*)"/g;
const importMap = /<script type="importmap">([\s\S]*?)<\/script>/g;
const moduleScript = /<script type="module">([\s\S]*?)<\/script>/g;
const moduleSpecifier = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g;

/**
 * Whether `url` is root-relative (`/x`, not `//host/x`) and outside `prefix`.
 * @param {string} url
 * @param {string} prefix
 */
function outside(url, prefix) {
  return url.startsWith('/') && !url.startsWith('//') && !url.startsWith(prefix);
}

/**
 * The root-relative URLs in `html` that do not start with `prefix`: in `href`
 * and `src` attributes, import maps, and imports inside inline module scripts.
 * Escaped text, such as code samples, is not a URL and is ignored.
 * @param {string} html
 * @param {string} prefix
 * @returns {string[]}
 */
export function findUnprefixed(html, prefix) {
  const urls = [...html.matchAll(attribute)].map((match) => match[1]);
  for (const [, json] of html.matchAll(importMap)) {
    const { imports = {}, scopes = {} } = JSON.parse(json);
    urls.push(...Object.values(imports), ...Object.values(scopes).flatMap((scope) => Object.values(scope)));
  }
  for (const [, code] of html.matchAll(moduleScript)) {
    urls.push(...[...code.matchAll(moduleSpecifier)].map((match) => match[1]));
  }
  return urls.filter((url) => outside(url, prefix));
}
