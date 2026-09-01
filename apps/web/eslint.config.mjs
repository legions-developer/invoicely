import { nextJsConfig } from "@invoicely/eslint-config/next-js";

const eslintConfig = [
  {
    ignores: [".content-collections/**", ".next/**", "next-env.d.ts"],
  },
  ...nextJsConfig,
];

export default eslintConfig;
