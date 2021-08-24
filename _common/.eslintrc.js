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
    "import/no-extraneous-dependencies": "off",
    "import/prefer-default-export": "off",
    "no-underscore-dangle": "off",
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error"
  }
};
