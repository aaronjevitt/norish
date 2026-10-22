# 08 — zod, tRPC and TanStack Query move together

Status: ready-for-agent
Blocked by: None — can start immediately
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Move the three lines the root `overrides` pin. Each moves together with its catalog entry:

| Package                                                      | Catalog and override today | Target  |
| ------------------------------------------------------------ | -------------------------- | ------- |
| `zod`                                                        | 4.4.3                      | 4.6.6   |
| `@trpc/client`, `@trpc/server`, `@trpc/tanstack-react-query` | 11.18.0                    | 11.19.0 |
| `@tanstack/react-query`                                      | 5.101.4                    | 5.104.2 |

- **Move `@tanstack/query-persist-client-core` in apps/web too**, at the same version. Otherwise a second `query-core` copy appears.

**Why now.** Better Auth 1.7 (ticket 09) calls `z.validate()`, which needs zod ≥ 4.5, in `@better-auth/core` on every session creation and rate-limit check. With the 4.4.3 override, every sign-in on 1.7 would throw.

**Before changing anything:**

- **Record why zod was pinned.** The override arrived in `53469908`. Read that change and write the reason down in the comments.
- **Read the zod 4.6.6 notes.** 4.6.6 was published 2026-10-11, and its notes were unreachable from the sandbox.
- **Keep the overrides as pins.** They exist to keep one copy of each package across the workspaces; move their values, don't drop them.

## Acceptance criteria

- [ ] **Single copies.** `pnpm why zod @trpc/server @tanstack/query-core` shows one version of each.
- [ ] **OpenAPI document.** The generated document (`/api/docs`; trpc-to-openapi with zod-openapi 5.4.x) is unchanged. Diff it before and after.
- [ ] **Type check.** A strict `tsc --noEmit` on packages/trpc, packages/api and packages/shared shows no new errors compared with the baseline.
- [ ] **Gates and E2E.** The repo gates pass, and `pnpm test:e2e` passes (the offline and realtime projects exercise the TanStack persist layer and tRPC subscriptions).

## Comments

- Filed 2026-10-12 with the spec.
