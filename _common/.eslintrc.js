module.exports = {
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
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
    'simple-import-sort'
  ],
  root: true,
  rules: {
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_"
      }
    ],
    "class-methods-use-this": "off",
    "import/prefer-default-export": "off",
    "no-underscore-dangle": "off",
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
