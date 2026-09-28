interface Member {
  name: string;
  static?: boolean;
  privacy?: string;
}

interface Declaration {
  members?: Member[];
}

interface Manifest<D extends Declaration = Declaration> {
  modules: { declarations?: D[] }[];
}

/**
 * The manifest without static, private, and protected members, the rule the
 * Eleventy API tables use (site/_includes/api.njk). Storybook would otherwise
 * list fields such as `#internals` in its docs tables, with controls.
 */
export function publicManifest<D extends Declaration, M extends Manifest<D>>(manifest: M): M {
  return {
    ...manifest,
    modules: manifest.modules.map((module) => ({
      ...module,
      declarations: module.declarations?.map((declaration) =>
        declaration.members === undefined
          ? declaration
          : {
              ...declaration,
              members: declaration.members.filter(
                (member) => !member.static && member.privacy !== 'private' && member.privacy !== 'protected',
              ),
            },
      ),
    })),
  };
}
