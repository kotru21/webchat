import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintPluginImport from "eslint-plugin-import";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "18.3" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      import: eslintPluginImport,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/jsx-no-target-blank": "off",
      "react/prop-types": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // FSD layering restriction (basic): запрещаем относительные подъемы через ../* между верхнеуровневыми слоями
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            { target: "src/entities", from: "src/features" },
            { target: "src/entities", from: "src/widgets" },
            { target: "src/entities", from: "src/pages" },
            { target: "src/entities", from: "src/processes" },
            { target: "src/entities", from: "src/app" },
            { target: "src/features", from: "src/widgets" },
            { target: "src/features", from: "src/pages" },
            { target: "src/features", from: "src/processes" },
            { target: "src/features", from: "src/app" },
            { target: "src/widgets", from: "src/pages" },
            { target: "src/widgets", from: "src/processes" },
            { target: "src/widgets", from: "src/app" },
            { target: "src/pages", from: "src/processes" },
            { target: "src/pages", from: "src/app" },
            { target: "src/processes", from: "src/app" },
          ],
        },
      ],
      // Запрет прямых относительных путей между верхнеуровневыми каталогами (требуем алиасы)
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "../app/*",
            "../processes/*",
            "../pages/*",
            "../widgets/*",
            "../features/*",
            "../entities/*",
            "../shared/*",
          ],
        },
      ],
    },
  },
];
