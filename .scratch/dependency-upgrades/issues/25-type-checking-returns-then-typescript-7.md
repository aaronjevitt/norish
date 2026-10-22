# 25 — Type checking comes back, then TypeScript 7

Status: needs-triage
Blocked by: 11
Target release: later; scheduled by the maintainer

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

**The gates don't type-check:**

- `apps/web/tsconfig.json` sets `"noCheck": true` (#333).
- Six workspace `typecheck` scripts pass `--noCheck`: api, auth, queue, shared-react, shared-server and trpc.
- `.github/workflows/_node-ci.yml` has no typecheck step at all.

**Why it matters for this effort.** Every upgrade here is riskier for it. Several breakages found during the research are plain type errors that no gate would report:

- BullMQ 6's removed `repeat` option and `Queue.client`;
- the client plugin Better Auth 1.7 removed;
- the `'paused'` job type.

**What TypeScript 7.0.2 is.** It makes a full check cheap enough to run on every PR.

- The `typescript` package is now a small JS wrapper around a statically linked Go binary, which runs on Alpine.
- `tsc` is the only bin.
- It ships no JS compiler API: `require("typescript")` returns only version information, and the new API is IPC-based under `typescript/unstable/*`.

**It can't be the main TypeScript yet:**

- typescript-eslint's peer range is `<6.1.0`, and it needs the JS API.
- pnpm 12's changelog records ESLint crashing ("reading 'Intrinsic'") when TS 7 ended up under typescript-eslint.

**Path:**

1. **Side-by-side install**, the recipe from the TypeScript 7.0 announcement:
   - `"typescript": "npm:@typescript/typescript6@^6.0.2"`
   - `"@typescript/native": "npm:typescript@^7.0.2"`

   `tsc` then runs TS 7, while `tsc6` and `require("typescript")` stay on TS 6. Next's build-time check falls back to `tsc6`. With `nodeLinker: hoisted`, confirm which `tsc` bin wins.

2. **Remove `--noCheck`** one workspace at a time, fixing errors as you go, and add a typecheck step to `_node-ci.yml`.
3. **Switch fully to TypeScript 7** when typescript-eslint supports it.

**Open:**

- whether TS 7 supports the `next` tsconfig plugin in editors;
- when TS 7.1's stable API lands.

**Preview.** TypeScript 6's hidden `stableTypeOrdering` option previews TS 7's output.

## Acceptance criteria (per step, once triaged)

- [ ] **Step 1.** `tsc --version` reports 7.x and `require("typescript").version` reports 6.x. Lint, Next's build and tsdown are unaffected.
- [ ] **Step 2.** Each workspace that drops `--noCheck` type-checks cleanly. CI runs `pnpm typecheck` and fails on errors.
- [ ] **Step 3.** `pnpm why typescript` shows only 7.x, and `pnpm lint` runs on it.

## Comments

- Filed 2026-10-12 with the spec.
- Sources:
  - the typescript 7.0.2, 6.0.3 and `@typescript/typescript6` 6.0.2 tarballs;
  - Next's `runTypeScriptCli.js` and `verify-typescript-setup.js` (16.4.0);
  - the pnpm 12.11.2 CHANGELOG;
  - a search summary of the TypeScript 7.0 announcement.
