import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        clearTimeout: "readonly",
      },
    },
    rules: {
      "no-console": "warn",
      "no-debugger": "warn",
      "eqeqeq": ["error", "always"],
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "no-implied-eval": "error",
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_|next" }],
    },
  },
  {
    ignores: ["node_modules/", "dist/", ".git/"],
  },
];
