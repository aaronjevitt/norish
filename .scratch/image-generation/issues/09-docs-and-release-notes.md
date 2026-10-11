# 09 — Docs and release notes

Status: resolved
Blocked by: 06, 07, 08

Spec: `.scratch/image-generation/spec.md`

## What to build

The feature is documented where a self-hoster will look for it, and the target version's release notes say it shipped.

## Notes

`apps/docs` sits outside the pnpm workspace, so no CI gate reaches it. A green board says nothing about the docs site — build it locally before calling this done.

Docusaurus hard-fails on a missing screenshot path, so capture screenshots before referencing them. The E2E `ai` stack is the usual source.

Configuration here is database-backed, so there is likely no new environment variable. Confirm that rather than assuming; if one appears it needs `.env.example`, the configuration page and the Upgrade notes.

Follow `docs/agents/feature-docs.md`.

## Acceptance criteria

- [ ] A documentation page covers configuring an image provider, the automatic switch, the manual action and the bulk sweep, with screenshots.
- [ ] The page states plainly that generating an image replaces the recipe's primary image, and that the replaced image is not recoverable.
- [ ] The target version's release notes describe the feature.
- [ ] Any new environment variable appears in `.env.example`, the configuration page and the Upgrade notes — or the absence of one is confirmed.
- [ ] The docs site builds locally and its link check passes.

## Comments

- 2026-08-22: Implemented (commit 06935dfd). Enrichment page names the seventh kind and warns the manual action replaces the primary irrecoverably; the AI provider page gains the Image Generation section (own provider, fallback, two requests, bulk count) with screenshots captured from the E2E ai stack; 0.21.0-beta release notes carry the feature. No new environment variable — the block is database-backed, stated on the config page. Docs build + link check pass locally (`apps/docs` `pnpm build`); the pre-existing `pnpm-lock.yaml` prettier warning there predates the branch.
