# 16 — pnpm 11, and the image installs what the lockfile says

Status: ready-for-agent
Blocked by: 07 (pnpm settings), 11 (pnpm 10.34.6)
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Two linked changes.

**1. The image stops re-resolving dependencies at build time.**

- **The problem.** `docker/Dockerfile` runs `pnpm deploy --legacy --filter @norish/web --prod`. That prints "A pnpm-lock.yaml file exists. The current configuration prohibits to read or write a lockfile." and resolves every dependency from its semver range on each build. This was reproduced in a scratch deploy.
- **Why it matters.** A published image contains whatever versions were current on the day it was built, not what CI tested. Two builds of the same commit can differ.
- **The Dockerfile comment is half right.** It calls legacy deploy "equivalent here", which is true for the workspace copies it deletes, but not for versions.

**2. pnpm 11 removes the reason for `--legacy`.**

- pnpm 10's default deploy needs `injectWorkspacePackages`, which the repo deliberately doesn't set. pnpm 11's deploy no longer requires it.
- So: move to pnpm 11 and deploy from the lockfile without `--legacy`.

**pnpm 11 changes that touch Norish:**

- **Node ≥ 22.13** (already met).
- **`onlyBuiltDependencies` is removed** in favour of an `allowBuilds` map (`pnpm-workspace.yaml`). Seed it with `pnpm ignored-builds` on pnpm 10 first.
- **`strictDepBuilds` is true.** Dependencies whose build scripts are silently ignored today would fail the install.
- **New defaults:** a `minimumReleaseAge` of one day, `blockExoticSubdeps`, and `verifyDepsBeforeRun: install`. Reconcile them with ticket 07's settings.
- **Every place that names the pnpm version:**
  - `packageManager` in `package.json`;
  - the pnpm line in `docker/Dockerfile`;
  - `.devcontainer/default/Dockerfile`.
- **The CI action.** Confirm that `pnpm/action-setup@v6` (`tooling/github/setup/action.yml`) supports pnpm 11.

**In the same PR, so the image is auditable:**

- **Stop copying nested `node_modules`.** Exclude `packages/*/node_modules` from the runtime `COPY /app/packages/`. It carries the build stage's nested copies, such as `packages/shared-server/node_modules/undici`.
- **Widen the deploy clean-up.** Add `vite`, `rolldown` / `@rolldown` (about 20 MB) and `@types`. They leak in through better-auth's optional `vitest` peer.
- **Add an image scan.** Trivy or Grype on the built image in `.github/workflows/_docker-build.yml`, with the same allowlist policy as ticket 07.

**Later.** pnpm 12 (a native Rust CLI with musl builds; unknown keys in `pnpm-workspace.yaml` become errors), once the CI action supports it.

## Acceptance criteria

- [ ] **Reproducible.** Two image builds of the same commit, a day apart, contain identical `node_modules` versions.
- [ ] **Matches the lockfile.** The deployed tree's lock matches `pnpm-lock.yaml` for production dependencies.
- [ ] **Size.** Image size before and after is recorded.
- [ ] **Scan.** The image scan runs in CI and is green, or green apart from allowlisted advisories.
- [ ] **pnpm 11 everywhere.** `pnpm install --frozen-lockfile` passes on pnpm 11 in CI, the devcontainer and Docker.
- [ ] **Gates and E2E.** The gates pass, and `pnpm test:e2e` passes against the image build.

## Comments

- Filed 2026-10-12 with the spec.
- Sources:
  - the pnpm 11.28.2 and 12.11.2 CHANGELOGs;
  - the pnpm 10.34.5 bundle;
  - a scratch `pnpm deploy --legacy` run.
