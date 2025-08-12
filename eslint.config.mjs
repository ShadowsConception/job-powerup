// eslint.config.mjs
// Flat config that effectively disables lint errors during CI builds.
export default [
  { ignores: [".next/**", "node_modules/**"] },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "prefer-const": "off",
    },
  },
];
