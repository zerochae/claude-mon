import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import prettier from "eslint-config-prettier";
import noTypesInTsx from "./eslint-rules/no-types-in-tsx.js";
import noConstantsInTsx from "./eslint-rules/no-constants-in-tsx.js";
import noInlineStyleInTsx from "./eslint-rules/no-inline-style-in-tsx.js";

export default [
  { ignores: ["dist", "src-tauri", "styled-system", "eslint.config.js", "eslint-rules"] },

  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["panda.config.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  reactHooks.configs.flat["recommended-latest"],

  {
    plugins: {
      "react-refresh": reactRefresh,
      "simple-import-sort": simpleImportSort,
      "local": {
        rules: {
          "no-types-in-tsx": noTypesInTsx,
          "no-constants-in-tsx": noConstantsInTsx,
          "no-inline-style-in-tsx": noInlineStyleInTsx,
        },
      },
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "local/no-types-in-tsx": "warn",
      "local/no-constants-in-tsx": "warn",
      "local/no-inline-style-in-tsx": "warn",
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],

      "no-console": "warn",
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
    },
  },

  prettier,
];
