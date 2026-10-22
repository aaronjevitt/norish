# 13 — Vitest 5

Status: ready-for-agent
Blocked by: None (independent of 12)
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Move `vitest` from 4.1.11 to **5.0.x**. 5.0.4 was published on 2026-10-12; take the newest 5.0 patch when the work starts.

- **Declare `vite` (8.3.x)** next to `vitest` in every workspace that runs tests. It is now a required peer.
- **Add `@vitest/coverage-v8`.** `apps/web/vitest.config.ts` uses it, but it isn't installed.

Changes that touch Norish, from the v5.0.4 migration guide:

- **`vi.mock` inside `describe` now throws.** This hits `packages/auth/__tests__/auth/password-auth-cache.test.ts`, which has six calls. Hoist them to module level, or use `vi.doMock`.
- **`clearMocks` now defaults to true.** Tests that rely on calls recorded in setup files or in `beforeAll` change. There are 62 `beforeAll`s, plus `apps/web/__tests__/setup.ts`.
  - Land the bump behaviour-neutral by setting `clearMocks: false` in each config.
  - Adopting the new default is a follow-up.
- **Unawaited `.resolves` / `.rejects` now fail the test.**
- **`test.each` titles** are formatted with pretty-format.
- **Reports go to `.vitest/`.** Add it to `.gitignore`.
- **jest-dom typings break in editors only.** 7.0.1 still extends `jest.Matchers` / `Assertion<T>`, while Vitest 5 uses `Assertion<R, T>`. The runtime is fine, and no gate type-checks the tests.

**Later:**

- the stable `fsModuleCache`;
- `vitest doctor`;
- a root `test.projects` setup, which runs one process instead of ten turbo tasks, at the cost of turbo's per-package caching.

## Acceptance criteria

- [ ] **Same test counts.** Each package runs the same number of tests before and after, under `NODE_ENV=test pnpm test:run` as CI runs it.
- [ ] **Behaviour-neutral.** No test was weakened to make it pass. Any `clearMocks` changes are deliberate and listed in the comments.
- [ ] **Coverage.** `pnpm test:coverage` runs.
- [ ] **Gates.** `pnpm lint`, `pnpm test:run`, `pnpm i18n:check` and `pnpm build` pass.

## Comments

- Filed 2026-10-12 with the spec.
- Sources:
  - the vitest 5.0.4 tarball;
  - `docs/guide/migration/index.md` and `docs/blog/vitest-5.md` at v5.0.4;
  - @testing-library/jest-dom 7.0.1.
