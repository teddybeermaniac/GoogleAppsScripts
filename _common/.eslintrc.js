module.exports = {
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:eslint-comments/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:json/recommended',
    'plugin:sonarjs/recommended',
    'plugin:unicorn/all'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    project: './tsconfig.json',
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint',
    'import',
    'json',
    'simple-import-sort',
    'sonarjs',
    'unicorn'
  ],
  root: true,
  rules: {
    // Allow marking unused variables with _ prefix.
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    // No, just... No.
    "class-methods-use-this": "off",
    // Force eslint-disable comments to be cleaned up.
    "eslint-comments/no-unused-disable": "error",
    // Remove ForOfSyntax from airbnb's config to replace it with for...of and satisfy unicorn/no-array-for-each.
    "no-restricted-syntax": [
      "error",
      "ForInStatement",
      "LabeledStatement",
      "WithStatement",
    ],
    // Allow marking unused variables with _ prefix.
    "no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    // Force exports to be sorted.
    "simple-import-sort/exports": "error",
    // Force imports to be sorted.
    "simple-import-sort/imports": "error",
    // This rule is a bit overzealous and leads to compiler errors.
    "unicorn/no-useless-undefined": "off",
    // Too new for Google Appss Script?
    "unicorn/prefer-at": "off",
    // Too new for Google Appss Script?
    "unicorn/prefer-string-replace-all": "off"
  }
};
