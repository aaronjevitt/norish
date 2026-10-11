# 05 — Contract legacy browser surfaces and prove the migration

**What to build:** Complete the Obscura cutover by removing the obsolete browser contract and proving the integrated repository through its normal acceptance gates.

**Blocked by:** 03 — Migrate deployment and contributor environments; 04 — Document Obscura and record the Imports decision

**Status:** ready-for-human

- [x] Active source, configuration, deployment, CI, tests, logs, docs, and package metadata contain no remaining `chrome-headless`, `CHROME_WS_ENDPOINT`, `rebrowser-playwright`, Chrome-service error, or fabricated browser-fingerprint reference.
- [x] Package manifests and the lockfile contain no Rebrowser dependency or obsolete Playwright generation introduced by the rendered-page runtime.
- [x] Comments and errors describe the Obscura-only rendered-fetch behavior and do not claim that an undocumented plain HTTP or Chrome fallback exists.
- [x] Chromium references that genuinely describe the unchanged Playwright browser-acceptance runner remain intact.
- [x] Existing rendered-fetch, URL-import, video-import, configuration, and affected package tests pass with the new contract.
- [x] All active Compose definitions pass their configuration-rendering checks.
- [x] `pnpm lint` passes.
- [x] `pnpm test:run` passes.
- [x] `pnpm i18n:check` passes.
- [x] `pnpm build` passes.
- [ ] The existing `pnpm test:e2e` browser gate passes without changing its Playwright projects or architecture.
- [x] No dedicated Obscura integration test, Playwright-to-Obscura smoke test, live-site corpus, anti-bot detector, or browser protocol-conformance suite is added.
- [x] Passed, failed, and environmentally blocked checks are reported separately; an unavailable container or browser environment is not reported as acceptance.

## Comments

**2026-08-09 — `pnpm test:e2e` is red for a reason that predates this work.** The
`ai` project passes in full (35/35). The `offline` project's first test, "a Live
visit installs the app shell and warms the Warm Set", times out waiting for
`navigator.serviceWorker.controller`, which strands the 10 tests behind it. The
same test fails identically on a clean `rc/0.21.0-beta` tree with this branch
stashed and a fresh `next build` — the plausible origin is 78fd0b19 "Serwist
turbopack (#522)", the commit at the branch head. Not fixed here: it is a
service-worker registration problem with nothing to do with the rendered-page
browser, and chasing it would smuggle an unrelated fix into this migration.

Every other gate passed: `pnpm lint` (15/15, 0 errors), `pnpm test:run` (10/10
tasks), `pnpm i18n:check`, `pnpm build` (14/14), the docs format check and
production docs build, `docker compose config` on all four active Compose
definitions plus the devcontainer stack, and `docker/obscura/verify-pin.sh`.
