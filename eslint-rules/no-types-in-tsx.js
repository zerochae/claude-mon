export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow exported type/interface declarations in .tsx files. Extract to a separate .ts file.",
    },
    messages: {
      noExportedType:
        "Export '{{name}}' type/interface to an external .ts file instead of defining in .tsx.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!filename.endsWith(".tsx")) return {};

    return {
      ExportNamedDeclaration(node) {
        const decl = node.declaration;
        if (!decl) return;
        if (
          decl.type === "TSInterfaceDeclaration" ||
          decl.type === "TSTypeAliasDeclaration"
        ) {
          context.report({
            node: decl,
            messageId: "noExportedType",
            data: { name: decl.id.name },
          });
        }
      },
    };
  },
};
