/**
 * The one place the landing page reads its build-time environment, matching the
 * repo-wide `env.ts` convention that keeps `process.env` out of app code.
 */
export const env = {
  /** Empty at the root domain, or a leading-slash subpath such as "/norish". */
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
};
