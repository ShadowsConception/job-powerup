// eslint.config.mjs (Flat config)
import tseslint from "typescript-eslint";

export default tseslint.config([
  // ignore build output
  { ignores: [".next/**", "node_modules/**"] },

  // base recommended
  ...tseslint.configs.recommended,

  // turn errors into warnings / off
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // was error
      "prefer-const": "off",                        // was error
      // keep the rest as-is or add more here if needed
    },
  },
]);
