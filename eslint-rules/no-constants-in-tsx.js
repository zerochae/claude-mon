export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow module-level UPPER_CASE constants in .tsx files. Extract to a separate .ts file.",
    },
    messages: {
      noConstant:
        "Constant '{{name}}' should be extracted to an external .ts file.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!filename.endsWith(".tsx")) return {};

    const UPPER_SNAKE = /^[A-Z][A-Z0-9_]+$/;

    return {
      "Program > VariableDeclaration[kind='const']"(node) {
        for (const decl of node.declarations) {
          if (decl.id.type === "Identifier" && UPPER_SNAKE.test(decl.id.name)) {
            context.report({
              node: decl,
              messageId: "noConstant",
              data: { name: decl.id.name },
            });
          }
        }
      },
    };
  },
};
