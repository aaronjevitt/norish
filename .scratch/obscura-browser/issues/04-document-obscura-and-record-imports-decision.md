# 04 — Document Obscura and record the Imports decision

**What to build:** Publish the operator-facing migration guidance and make the rendered-page architecture an explicit, durable Imports decision.

**Blocked by:** 03 — Migrate deployment and contributor environments

**Status:** ready-for-human

- [x] Current environment examples and configuration documentation define `OBSCURA_ENDPOINT`, its shipped default, and the expected external-Obscura endpoint contract.
- [x] Parser and development documentation explain that Obscura renders non-video URL imports before structured parsing and AI fallback consume the HTML.
- [x] README, website, and Quick Start prose describe the owned Obscura sidecar consistently with the active deployment examples.
- [x] The Target Version release notes include an operator-facing improvement entry for replacing the third-party Chromium container.
- [x] The Target Version Upgrade notes call out the breaking `CHROME_WS_ENDPOINT` to `OBSCURA_ENDPOINT` rename and the required service change.
- [x] A new globally numbered `ADR-0019` is added in an Imports ADR area and the ADR index links it.
- [x] ADR-0019 records the pinned Norish-owned sidecar, full always-on stealth, official Playwright Core, Obscura-only/no-fallback policy, simplified ownership boundary, and retained private-network protection, including their trade-offs.
- [x] No unrelated existing ADR is rewritten, frozen versioned documentation remains unchanged, and `CONTEXT.md` gains no Obscura, CDP, or stealth glossary entry.
- [x] Documentation formatting, generated snippets, links, and the docs build pass their existing validation.

## Comments

**2026-08-09 — the Target Version turned out to be `0.21.0-beta`, not
`0.20.0-beta`.** `v0.20.0-beta` shipped on 2026-08-07 but no Release Checkpoint
had run since, so the editable docs still carried a label operators already have
installed — and the first draft of the Upgrade note landed there, telling people
running 0.20.0-beta to change a setting that works fine in 0.20.0-beta.

`pnpm docs_update 0.21.0-beta` was run per `docs/agents/feature-docs.md`
("They don't exist yet … make the checkpoint first"). `0.20.0-beta` is frozen
under `versioned_docs/` exactly as it shipped — still describing
`chrome-headless`, which is the truth for that release — and the improvement
entry and Upgrade note now live in `release-notes/0.21.0-beta.md`. The
"frozen versioned documentation remains unchanged" criterion above still holds:
freezing 0.20.0-beta is the checkpoint the convention requires, and the
already-frozen 0.19.x snapshots were not touched.
