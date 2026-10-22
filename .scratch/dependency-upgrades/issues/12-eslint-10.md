# 12 — ESLint 10

Status: ready-for-agent
Blocked by: 11 (removes eslint-plugin-import and moves typescript-eslint to 8.71)
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Move `eslint` from 9.39.5 to **10.12.0** and `@eslint/js` to **10.0.1**. npm marks 9.39.5 "no longer supported".

Changes that touch Norish, from ESLint's v10 migration guide and the 10.12.0 tarball:

- **Rule-context members were removed:** `context.getFilename`, `getSourceCode`, `getCwd`, `getPhysicalFilename`, `parserOptions` and `parserPath`.
  - **eslint-plugin-react 7.37.5 crashes.** It calls `context.getFilename()` whenever `settings.react.version` is `"detect"`, which `tooling/eslint/react.ts` sets. That breaks `display-name`, `no-deprecated`, `no-unknown-property`, `no-string-refs` and `no-render-return-value`.
  - **Fix:** wrap the react plugin, and jsx-a11y to be safe, in `fixupPluginRules` from `@eslint/compat`, which puts the members back. Alternatively, set an explicit React version string.
  - **Peer warnings remain** for eslint-plugin-react (`≤ ^9.7`) and jsx-a11y (`≤ ^9`).
- **eslint-plugin-import** uses the removed members too. Ticket 11 removes it.
- **`eslint:recommended` has three new error-level rules:** `no-unassigned-vars`, `no-useless-assignment` and `preserve-caught-error`.
  - A regex estimate finds about 8 `preserve-caught-error` hits, all in `packages/api/src/video/`: `yt-dlp.ts`, `processor.ts` and `processors/instagram.ts`.
  - Fix them by passing `{ cause }` to the rethrown error. Don't switch the rules off; if one is switched off, give the reason.
- **Unaffected:**
  - the new per-file config lookup (every package has its own config);
  - the `--flag unstable_native_nodejs_ts_config` flag, which is still valid in 10.12;
  - `eslint-env` comments (there are none).

**Improvement, in a separate commit.**

- `tooling/eslint/base.ts` turns on `projectService`, but no type-aware rule is enabled: it uses `tseslint.configs.recommended`, and the `no-unsafe-*` rules are off.
- Dropping `projectService` should cut lint time noticeably. It may also allow removing `--concurrency=1` from the root `lint` script, and the special handling in `apps/web/eslint.config.ts`.
- The alternative is to adopt `recommendedTypeChecked` deliberately.
- Measure either way with `TIMING=1`.

## Acceptance criteria

- [ ] **No crashes.** No "getFilename is not a function" and no rule-loading errors anywhere.
- [ ] **New rules.** Hits are fixed rather than disabled, or disabled with a reason.
- [ ] **Warning counts.** Compared with the 9.39.5 baseline and recorded in the comments.
- [ ] **Timing.** `pnpm lint` wall time before and after is recorded, including the `projectService` experiment.
- [ ] **Gates.** `pnpm lint`, `pnpm test:run`, `pnpm i18n:check` and `pnpm build` pass.

## Comments

- Filed 2026-10-12 with the spec.
- Sources:
  - the eslint 9.39.5 and 10.12.0 tarballs;
  - `migrate-to-10.0.0.md` at v10.12.0;
  - the tarballs of eslint-plugin-react 7.37.5, jsx-a11y 6.10.2, eslint-plugin-import 2.32.0 and `@eslint/compat` 2.1.1.
