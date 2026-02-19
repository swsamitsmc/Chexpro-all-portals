module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Disable prop-types validation (not critical for this project)
    'react/prop-types': 'off',
    // Disable unused vars warnings (development convenience)
    'no-unused-vars': 'warn',
    // Allow console.log for debugging
    'no-console': 'off',
    // Disable JSX undefined warnings
    'react/jsx-no-undef': 'warn',
    // Disable unescaped HTML entity warnings (not critical)
    'react/no-unescaped-entities': 'off',
    // Disable react-hooks exhaustive deps warnings
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    {
      files: ['tailwind.config.js', 'vite.config.js'],
      env: { node: true },
    },
  ],
};
