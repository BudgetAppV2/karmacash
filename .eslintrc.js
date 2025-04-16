module.exports = {
    env: {
      browser: true,
      es2021: true,
      node: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:react/jsx-runtime',
      'plugin:react-hooks/recommended',
      'prettier'
    ],
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: ['react', 'prettier'],
    rules: {
      'prettier/prettier': 'error',
      'react/prop-types': 'warn', // Consider 'error' for stricter type checking
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react/jsx-no-target-blank': 'error',
      'react/no-unescaped-entities': 'warn'
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  };