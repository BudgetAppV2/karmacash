module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    'ecmaVersion': 2018,
  },
  extends: [
    'eslint:recommended',
  ],
  rules: {
    'no-restricted-globals': ['error', 'name', 'length'],
    'prefer-arrow-callback': 'error',
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
    'no-unused-vars': ['warn', { 'args': 'none' }],
    'operator-linebreak': 'off',
    'comma-dangle': 'off',
    'object-curly-spacing': 'off',
    'indent': 'off',
    'no-trailing-spaces': 'off',
    'no-prototype-builtins': 'off',
    'eol-last': 'off'
  },
  overrides: [
    {
      files: ['**/*.spec.*'],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
