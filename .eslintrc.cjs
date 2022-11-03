module.exports = {
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:astro/recommended",
  ],
  "root": true,
  "parser": "@typescript-eslint/parser",
  "ignorePatterns": ["src/**/*.css", "src/**/*.md"],
  "rules": {
    "indent": ["error", 2],
    "linebreak-style": ["error", "windows"],
    "quotes": ["error", "single"],
    "semi": ["error", "always"],
  },
  "overrides": [
    {
      files: ["*.astro"],
      plugins: ["astro"],
      env: {
        node: true,
        "astro/astro": true,
        es2020: true,
      },
      parser: "astro-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtenstions: [".astro"],
        sourceType: "module",
      },
      rules: {
        "astro/no-conflict-set-directives": "error",
        "astro/no-unused-define-vars-in-style": "error",
      },
    },
  ],
};
