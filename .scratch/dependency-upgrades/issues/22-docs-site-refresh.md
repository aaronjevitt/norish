# 22 — The docs site refresh

Status: ready-for-agent
Blocked by: None — can start immediately
Target release: 0.26.0-beta. The `wrangler` pin is worth doing sooner.

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

`apps/docs` is a Docusaurus site and a standalone pnpm workspace, with its own lockfile.

- **No stable major to take.** Docusaurus 3.10.2 is npm `latest`; 4.0 exists only as canary builds.
- **A refresh within the current ranges** (`pnpm update` inside apps/docs) moves React to 19.3.0, mermaid to 12.1.0 and prettier to 3.9.10. In a scratch run it took the audit from **56 advisories (4 critical, 30 high) to 8**.
- **What remains** needs Docusaurus to update upstream:
  - braces (no fix exists);
  - katex (low);
  - postcss-selector-parser 6;
  - serialize-javascript 6.0.2 (two advisories);
  - tinypool (two advisories);
  - uuid 8.3.2.
- **Where the critical advisories sit.** They are in the dev server (proxy-addr and shell-quote via webpack-dev-server) and in the build-time workers (tinypool). The static site the deploy publishes contains none of them.

**TypeScript in apps/docs.** It is on `~5.9.3`, used only by its `typecheck` script. Stay on 5.9 or move to 6. TypeScript 6 deprecates `baseUrl`, which `apps/docs/tsconfig.json` uses, so check whether Docusaurus' tsconfig preset needs it first.

**Pin `wrangler`.** `.github/workflows/docs-deploy.yml` deploys to Cloudflare Pages on pushes to main that touch `apps/docs/**`. It fetches an unpinned `wrangler@4` through `pnpm dlx`, in a job that holds `CLOUDFLARE_API_TOKEN`. Pin an exact version.

## Acceptance criteria

- [ ] **Format and build.** `pnpm format` and `pnpm build` in apps/docs pass; the build enforces broken links and anchors.
- [ ] **Audit.** The apps/docs audit count is recorded before and after.
- [ ] **Deploy.** `wrangler` is pinned to an exact version, and the deploy workflow is green on its next run.

## Comments

- Filed 2026-10-12 with the spec.
- Sources:
  - `pnpm outdated` and `pnpm audit` inside apps/docs;
  - a scratch refresh and its audit.
