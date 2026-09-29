/**
 * The analyzer skips an `@internal` class field, but its Lit plugin adds the
 * field back from `static properties`: drop it, and its inherited copies.
 */
function internalMembers() {
  const internal = new Set();
  return {
    name: 'internal-members',
    analyzePhase({ ts, node }) {
      if (!ts.isClassDeclaration(node) || node.name === undefined) return;
      for (const member of node.members) {
        const tags = ts.getJSDocTags(member).map((tag) => tag.tagName.getText());
        if (member.name !== undefined && tags.includes('internal')) {
          internal.add(`${node.name.getText()}.${member.name.getText()}`);
        }
      }
    },
    packageLinkPhase({ customElementsManifest }) {
      for (const module of customElementsManifest.modules) {
        for (const declaration of module.declarations ?? []) {
          declaration.members = declaration.members?.filter(
            (member) => !internal.has(`${member.inheritedFrom?.name ?? declaration.name}.${member.name}`),
          );
        }
      }
    },
  };
}

export default {
  // The mixins and ToggleBase are included so their attributes appear on the elements that use them.
  globs: ['src/components/**/*.ts', 'src/lit/form-associated.ts', 'src/lit/delegates-focus.ts'],
  exclude: ['src/components/**/*.styles.ts', 'src/components/define/**', 'src/components/shared/!(toggle).ts', 'src/components/index.ts'],
  outdir: 'dist',
  litelement: true,
  plugins: [internalMembers()],
};
