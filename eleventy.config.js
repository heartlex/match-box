export default function (eleventyConfig) {
  // The site consumes the built package exactly as a user would.
  eleventyConfig.addPassthroughCopy({ dist: 'pkg' });
  eleventyConfig.addPassthroughCopy('site/demos');
  return { dir: { input: 'site', output: '_site' } };
}
