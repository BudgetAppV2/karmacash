module.exports = {
  env: {
    node: true,
    browser: true,
    commonjs: true,
    es2021: true,
    jest: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn'],
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'comma-dangle': ['error', 'never'],
    'arrow-parens': ['error', 'as-needed']
  }
}; 