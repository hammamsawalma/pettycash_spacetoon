import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Downgrade noisy rules to warnings — keeps CI annotations clean
      // while still flagging issues for developers to address over time
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/rules-of-hooks": "error",  // fundamental — must never be warn
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
  // Test fixture files use React 19's use() in non-component helper functions
  // which triggers false-positive rules-of-hooks errors
  {
    files: ["tests/**/*.ts", "tests/**/*.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;

