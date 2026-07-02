module.exports = {
  plugins: {
    '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
  },
  languageOptions: {
    parser: require('@typescript-eslint/parser'),
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    globals: {
      require: 'readonly',
      module: 'readonly',
      process: 'readonly',
      console: 'readonly',
      __dirname: 'readonly',
      __filename: 'readonly',
    },
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'off',
  },
  ignores: ['node_modules/**'],
};
