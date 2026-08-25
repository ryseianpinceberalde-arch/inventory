import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import hooks from "eslint-plugin-react-hooks";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tsParser, parserOptions: { project: "./tsconfig.json" } },
    plugins: { "@typescript-eslint": tseslint, "react-hooks": hooks },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...hooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
];
