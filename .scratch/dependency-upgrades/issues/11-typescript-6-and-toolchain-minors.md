# 11 — TypeScript 6 and the toolchain minors

Status: ready-for-agent
Blocked by: None — can start immediately
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

**TypeScript.** Move `typescript` in the catalog from 5.9.3 to **6.0.3**.

- The repo already runs two TypeScript versions: the lockfile resolves 6.0.3 as the peer for `@trpc/*`, next-intl, `@serwist/*` and apps/web's tsdown, pulled in by apps/mobile's `~6.0.3`. The move removes that split.
- TypeScript 7 is the native compiler and is held (ticket 25).

**Minor and patch bumps, in the same PR:**

- `typescript-eslint` 8.71.1, `@eslint/compat` 2.1.1, `globals` 17.13.0, `eslint-plugin-turbo` 2.11.7;
- `turbo` 2.11.7, `prettier` 3.9.10, `tsx` 4.23.15;
- `vite` 8.3.4, `@vitejs/plugin-react` 6.1.2;
- `@playwright/test` and `playwright-core` 1.64.0. The server uses `connectOverCDP`, so the client and browser versions are not coupled;
- `drizzle-kit` 0.31.11;
- `packageManager` → `pnpm@10.34.6`.

**Remove `eslint-plugin-import`.** `tooling/eslint/base.ts` registers it only to switch `import/order` off, and it uses rule-context APIs that ESLint 10 removed (ticket 12).

**TypeScript 6 changes that touch Norish** (checked in the 6.0.3 compiler source):

- **`types` now defaults to `[]`.** `tooling/typescript/base.json` sets no `types`.
  - Effect: web, landing, api, auth, db, i18n, queue, trpc and ui all lose the implicit `@types/node`.
  - packages/db, which type-checks for real, would fail on its Node globals, and the `--noCheck` declaration builds would quietly emit `any`.
  - Fix: add `"types": ["node"]` to `base.json`. `apps/web/tsconfig.sw.json` keeps its explicit `[]`.
- **`noUncheckedSideEffectImports` is on by default.**
  - `apps/landing/app/layout.tsx` imports `./globals.css`, which resolves only through `next-env.d.ts`. That file is gitignored, so landing's typecheck fails on a clean checkout.
  - Fix: run `next typegen` before landing's `typecheck`, or declare `*.css` side-effect modules.
- **`dom.iterable` is folded into `dom`.** The entries in `apps/web/tsconfig.json` and `apps/landing/tsconfig.json` are now redundant; remove them.
- **Options deprecated in 6 and removed in 7** — `baseUrl`, `node10`/classic resolution, an ES5 target, `esModuleInterop: false`, `outFile`, AMD/UMD/System modules, `downlevelIteration`. None appear in a gated workspace. `apps/docs/tsconfig.json` uses `baseUrl` but stays on its own TypeScript (ticket 22).

**Hygiene, while touching the manifests:**

- Declare `typescript: catalog:` in every workspace that runs `tsc`; today they rely on root hoisting.
- Move `tsx`, which is pinned in three places, into the catalog.

## Acceptance criteria

- [ ] **One TypeScript.** `pnpm why typescript` shows a single 6.0.3 outside apps/mobile.
- [ ] **Type check.** `pnpm typecheck` passes, and its output is compared with a 5.9.3 baseline.
- [ ] **No new `any`.** Diffing `packages/*/dist/*.d.ts` before and after shows no new `any`.
- [ ] **Landing.** Landing's `typecheck` passes on a clean checkout.
- [ ] **Gates.** `pnpm lint`, `pnpm test:run`, `pnpm i18n:check` and `pnpm build` pass.

## Comments

- Filed 2026-10-12 with the spec.
- Sources:
  - the typescript 6.0.3 and 7.0.2 tarballs;
  - typescript-eslint 8.71.1's peer range (`>=4.8.4 <6.1.0`).
