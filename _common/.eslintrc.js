module.exports = {
  extends: [
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint'
  ],
  root: true,
  rules: {
    "import/prefer-default-export": "off",
    "no-underscore-dangle": "off"
  }
};
