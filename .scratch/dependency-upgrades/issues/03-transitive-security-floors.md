# 03 — Transitive advisories get security floors

Status: ready-for-agent
Blocked by: None — can start immediately (independent of 01 and 02)
Target release: 0.25.0-beta (safe fixes only)

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Most transitive findings are stale lockfile state, not real constraints: their parents already allow the patched release. pnpm 10 has no targeted way to refresh a single transitive dependency (`pnpm update <name>` left both undici copies in place and changed unrelated packages), so apply the fixes as **range-selector overrides**. pnpm matches each selector against the dependent's declared range, so only the vulnerable ranges move, and only to a patch release inside the same major.

**Direct bump:** `undici` `^7.30.0` in `packages/shared-server`.

- 7.29.0 has high advisories, fixed in 7.29.1: a TLS-validation bypass in BalancedPool, and a DoS via an unrequested WebSocket subprotocol.
- Stay on 7; 8 is held (see the spec).

**Overrides.** Append this block under the existing `overrides:` key in `pnpm-workspace.yaml`, indented like the entries already there. In a scratch copy these floors changed 42 lockfile packages, and every remaining non-mobile transitive advisory cleared except the two named under **Left for 0.26**.

```yaml
overrides:
  # … the existing entries stay as they are …
  # Security floors (2026-10-12): drop each one once its parents require a patched release
  "@babel/core@<7.29.6": ^7.29.6
  "@grpc/grpc-js@>=1.14.0 <1.14.5": ^1.14.5
  "@humanfs/node@<0.16.8": ^0.16.8
  "@protobufjs/utf8@<1.1.1": ^1.1.1
  "baseline-browser-mapping@<2.11.0": ^2.11.0
  "brace-expansion@<1.1.21": ^1.1.21
  "brace-expansion@>=2.0.0 <2.1.7": ^2.1.7
  "browserslist@<4.28.7": ^4.28.7
  "fast-copy@>=4.0.0 <4.1.0": ^4.1.0
  "js-yaml@>=4.0.0 <4.3.2": ^4.3.2
  "lodash@<4.18.0": ^4.18.0
  "nanoid@>=5.0.0 <5.1.16": ^5.1.16
  "protobufjs@<7.6.5": ^7.6.5
  "qs@<6.16.0": ^6.16.0
  "sharp@<0.35.5": ^0.35.5
  "source-map-js@<1.2.2": ^1.2.2
  "undici@>=7.0.0 <7.29.1": ^7.29.1
  "undici@>=8.0.0 <8.10.2": ^8.10.2
```

**Left for 0.26 (ticket 28).** Removing the unused optional peers — `prisma`, `@prisma/client`, `mysql2` and drizzle-kit's `@esbuild-kit/esm-loader` — is not a patch-level change: it deletes a subtree of more than 100 lockfile entries. What they carry doesn't ship (dev and build only), so they wait for 0.26:

- esbuild 0.18.20 (moderate);
- the hono / effect / valibot / deepmerge-ts cluster, which the audit attributes to apps/mobile.

## Notes

**Where each finding comes from, and whether it ships:**

| Package                                                            | Path                                                   | Ships in the image?                                                                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| protobufjs, @protobufjs/utf8, @grpc/grpc-js                        | testcontainers › dockerode (dev)                       | No                                                                                                                                |
| undici 7.29.0                                                      | shared-server (direct)                                 | **Yes.** Inlined into `dist-server` by tsdown (the AI transport's `Agent`), plus a nested copy that `COPY /app/packages/` carries |
| undici 7.24.6                                                      | api › cheerio 1.2.0 (latest, `^7.19.0`)                | Build and CI only                                                                                                                 |
| undici 8.10.0                                                      | testcontainers, jsdom (dev)                            | No                                                                                                                                |
| nanoid 5.1.11                                                      | web › `@scalar/nextjs-api-reference` › `@scalar/types` | **Yes**, in the `/api/docs` chunk                                                                                                 |
| qs 6.15.0                                                          | trpc › trpc-to-openapi 3.3.0 › co-body                 | Bundled, but unreachable: the fetch adapter parses bodies itself                                                                  |
| fast-copy 4.0.2                                                    | shared-server › pino-pretty                            | External; the image re-resolves it                                                                                                |
| lodash 4.17.23, brace-expansion 2.0.3                              | shared-server › archiver 7 › archiver-utils            | **Yes**, inlined with archiver (archiver 8 drops both; ticket 20)                                                                 |
| js-yaml, brace-expansion 1.x, @humanfs/node                        | eslint and its config tooling                          | No                                                                                                                                |
| source-map-js, browserslist, baseline-browser-mapping, @babel/core | next › postcss / styled-jsx                            | Build time only                                                                                                                   |

**The image does not install from the lockfile.**

- `pnpm deploy --legacy` (`docker/Dockerfile`) prints "A pnpm-lock.yaml file exists. The current configuration prohibits to read or write a lockfile." It re-resolves every dependency from its semver range on each image build. This was reproduced in a scratch deploy.
- It does honour `overrides`, so these floors protect the image as well.
- Lockfile versions still reach the image in three ways:
  - modules tsdown inlines into `dist-server`;
  - modules Next bundles into its server chunks;
  - nested `packages/*/node_modules` copied in by `COPY /app/packages/`.
- Ticket 16 fixes the root cause.

**Untouched here.** The Expo tooling cluster (ticket 23) stays as it is.

## Acceptance criteria

- [ ] **Audit.** `pnpm audit` lists nothing outside three groups: the Expo cluster, the unused prisma/esbuild-kit subtree (ticket 28), and `next` and `better-auth` until 01 and 02 land.
- [ ] **Lockfile diff.** Reviewed: only the floored packages change (about 42 entries in the scratch run), each within its major.
- [ ] **Image.** Inside a production Docker build, the deployed tree (`/app/deploy/node_modules/.pnpm/lock.yaml`) shows the floored versions, and the nested `packages/shared-server/node_modules/undici`, if present, is ≥ 7.29.1.
- [ ] **Gates and E2E.** The repo gates pass, and `pnpm test:e2e` passes (the realtime and AI projects exercise undici and ws). An archive export works (archiver with the floored lodash and brace-expansion).
- [ ] **Release notes.** None of its own; it is covered by 01's security bullet.

## Comments

- Filed 2026-10-12 with the spec.
- 2026-10-12 — Narrowed for the safe-fixes-only 0.25. The dead-peer removals and the in-range dev bumps (testcontainers, jsdom, drizzle-orm) moved to ticket 28.
