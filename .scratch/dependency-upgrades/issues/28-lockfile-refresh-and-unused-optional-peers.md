# 28 — The lockfile is refreshed and sheds unused optional peers

Status: ready-for-agent
Blocked by: 03
Target release: 0.26.0-beta (early, so the cycle soaks it)

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

**1. Remove the unused optional peers.** Add these `overrides` entries in `pnpm-workspace.yaml`:

```yaml
overrides:
  # … the existing entries stay as they are …
  # Optional peers resolved once and never used; they only carry advisories
  "drizzle-kit>@esbuild-kit/esm-loader": "-"
  "@prisma/client": "-"
  mysql2: "-"
  prisma: "-"
```

- **prisma 7.4.2** was resolved once as an optional peer of better-auth and drizzle-orm, and nothing in Norish uses it. It carries:
  - lodash 4.17.21, through an exact pin in chevrotain;
  - hono and @hono/node-server;
  - effect;
  - mysql2;
  - valibot;
  - deepmerge-ts.
- **`@esbuild-kit/esm-loader`** is deprecated, and drizzle-kit's bundle never loads it. It carries esbuild 0.18.20.

**2. In-range dev bumps:**

- `@testcontainers/postgresql` and `@testcontainers/redis` `^12.2.0`.
- `jsdom` `^30.1.2`. It needs Node `^22.22.2` or `^24.15`; CI and ticket 04's image both satisfy that.
- `drizzle-orm` 0.45.4. It changes only postgres-js, and Norish uses node-postgres.

**3. Refresh everything else within the existing ranges.**

- In a scratch run, `pnpm update -r` changed 557 packages and a from-scratch re-lock changed 626.
- Review the diff by package, not line by line: group it by direct dependency, and read the changelog of anything that ships in the image.

**4. Prune ticket 03's floors** whose parents now require a patched release. Keep a floor only while `pnpm why` still shows a parent that would otherwise resolve the vulnerable range.

## Acceptance criteria

- [ ] **Peers gone.** `pnpm why prisma mysql2 @prisma/client @esbuild-kit/esm-loader` prints nothing. `pnpm db:generate` and `pnpm db:push` against a scratch database still work, proving drizzle-kit doesn't need the removed loader.
- [ ] **Audit.** `pnpm audit` lists nothing outside the Expo cluster (ticket 23).
- [ ] **Floors.** Every floor that remains has a comment naming the parent that still needs it.
- [ ] **Gates and E2E.** The repo gates pass, `pnpm test:e2e` passes, and a Docker build passes its health check.

## Comments

- Filed 2026-10-12, split out of ticket 03 when the maintainer limited 0.25 to safe fixes.
