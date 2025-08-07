import globals from "globals";

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.commonjs,
        ...globals.es2021,
      },
    },
    rules: {
      // Add any specific rules for your backend here
    },
  },
];
