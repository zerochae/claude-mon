export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Warn when using purely static inline style={{}} in JSX. Dynamic styles (containing variables/expressions) are allowed.",
    },
    messages: {
      noInlineStyle:
        "Static inline style={{}} detected. Extract to a styles file or use css() from styled-system.",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!filename.endsWith(".tsx")) return {};

    function isStaticValue(node) {
      if (node.type === "Literal" || node.type === "TemplateLiteral") return true;
      if (node.type === "UnaryExpression") return isStaticValue(node.argument);
      return false;
    }

    function isFullyStatic(obj) {
      return obj.properties.every(
        (p) =>
          p.type === "Property" &&
          !p.computed &&
          isStaticValue(p.value),
      );
    }

    return {
      JSXAttribute(node) {
        if (
          node.name.name === "style" &&
          node.value?.type === "JSXExpressionContainer" &&
          node.value.expression.type === "ObjectExpression" &&
          isFullyStatic(node.value.expression)
        ) {
          context.report({ node, messageId: "noInlineStyle" });
        }
      },
    };
  },
};
