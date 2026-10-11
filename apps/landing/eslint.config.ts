import { defineConfig } from "eslint/config";

import { baseConfig, restrictEnvAccess } from "../../tooling/eslint/base.ts";
import { nextjsConfig } from "../../tooling/eslint/nextjs.ts";
import { reactConfig } from "../../tooling/eslint/react.ts";

export default defineConfig(
  {
    ignores: [".next/**", "out/**"],
  },
  baseConfig,
  reactConfig,
  nextjsConfig,
  restrictEnvAccess,
  {
    // This app is a static export with the image optimizer switched off, so
    // next/image would add client runtime without optimising anything — and it
    // cannot emit the srcset the screenshots rely on. Plain <img> is correct here.
    rules: {
      "@next/next/no-img-element": "off",
    },
  }
);
