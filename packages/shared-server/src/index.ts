import { readFile } from "node:fs/promises";
import path from "node:path";

export * from "./logger";
import { resolveExistingWorkspacePath } from "./lib/workspace-paths";

type PackageVersionManifest = {
  version: string;
};

export type AppVersions = {
  app: string;
  web: string;
  mobile: string;
};

const workspaceRoot = path.dirname(resolveExistingWorkspacePath("pnpm-workspace.yaml"));

async function readPackageVersion(relativePath: string, fallbackVersion?: string) {
  try {
    const packageJson = await readFile(path.join(workspaceRoot, relativePath), "utf8");

    return (JSON.parse(packageJson) as PackageVersionManifest).version;
  } catch (error) {
    if (fallbackVersion !== undefined) {
      return fallbackVersion;
    }

    throw error;
  }
}

const appVersionsPromise = Promise.all([
  readPackageVersion("package.json"),
  readPackageVersion("apps/web/package.json"),
  readPackageVersion("apps/mobile/package.json", "unavailable"),
]).then(([appVersion, webVersion, mobileVersion]) => {
  return {
    app: appVersion,
    web: webVersion,
    mobile: mobileVersion,
  } satisfies AppVersions;
});

export function getAppVersions() {
  return appVersionsPromise;
}
