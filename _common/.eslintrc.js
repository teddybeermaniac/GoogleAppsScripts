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
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "class-methods-use-this": "off",
    "import/prefer-default-export": "off",
    "no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error"
  }
};
