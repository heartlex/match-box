export default function (eleventyConfig) {
  // The site consumes the built package exactly as a user would.
  eleventyConfig.addPassthroughCopy({ dist: 'pkg' });
  eleventyConfig.addPassthroughCopy('site/demos');
  // Lit for the component demos, served as ES modules through the import map.
  eleventyConfig.addPassthroughCopy({
    'node_modules/lit': 'vendor/lit',
    'node_modules/lit-html': 'vendor/lit-html',
    'node_modules/lit-element': 'vendor/lit-element',
    'node_modules/@lit/reactive-element': 'vendor/@lit/reactive-element',
  });
  return { dir: { input: 'site', output: '_site' }, markdownTemplateEngine: 'njk' };
}
