# 15 — Node 24 LTS

Status: ready-for-agent
Blocked by: 04
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Move the runtime to Node 24.

**Why.** Node 22 is in maintenance until 2027-04-30. Node 24 is LTS, in maintenance from 2026-10-20 and supported until 2028-04-30. Every target tool supports it: the engine floors this effort raises (ESLint 10 ≥ 22.13, Vitest 5 ≥ 22.12, tsdown 0.23 ≥ 22.18, pnpm 11 ≥ 22.13) are all met. The native dependencies (sharp, `@tailwindcss/oxide`, esbuild, msgpackr-extract) are N-API or prebuilt.

**Changes:**

- **Base image.** `docker/Dockerfile` moves to `node:24-alpine3.24` (24.21.0 at research time, pushed 2026-09-18) on both `FROM` lines.
- **`@types/node` `^24.19.2`** in the catalog (it is `^25.9.5` today). The types should follow the runtime major: 25.x accepts Node 25 APIs that fail at runtime on Node 22 or 24.
- **The libvips clean-up.** Ticket 04 records which libvips sharp loads in the image. If it is sharp's prebuilt one, remove `vips-dev` and `SHARP_IGNORE_GLOBAL_LIBVIPS` from `docker/Dockerfile` here, as dead weight.
- **Every file that names the Node version:**
  - `.nvmrc`;
  - `.devcontainer/default/Dockerfile`;
  - `.github/workflows/_docker-build.yml` and the CI setup;
  - `CONTRIBUTING.md`;
  - the stack line in `AGENTS.md` ("Node.js 22").
- **Alpine packages.** Re-check them on the new base, as in ticket 04.

**Who is affected.** Only installs that run Norish outside Docker, from source, need to act. They get an Upgrade note.

**Later.** Node 26 becomes LTS on 2026-10-28; revisit it for 0.27 or later.

## Acceptance criteria

- [ ] **Node version.** The image runs Node 24, and CI runs the gates on Node 24.
- [ ] **Image smoke.** The health check, a video import, an image upload (including HEIC) and a URL import through the parser all work.
- [ ] **E2E.** `pnpm test:e2e` passes.
- [ ] **Release notes.** An Upgrade note for source installs (Node 24 required) and a bullet under `## Fixes and Improvements`.

## Comments

- Filed 2026-10-12 with the spec.
- Sources:
  - the release schedule (`schedule.json`) from nodejs/Release;
  - `versions.json` from nodejs/docker-node;
  - the Docker Hub tags API.
