# 05 — Perplexity moves to the Agent API

Status: ready-for-agent
Blocked by: None. **Urgent**: the Sonar API that Norish calls was retired on 2026-09-27.
Target release: 0.25.0-beta (safe fixes only; open question 1 in the spec)

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Move **only** `@ai-sdk/perplexity`, from 4.0.48 to the newest **5.0.x**. Every other AI package stays where it is in 0.25; ticket 29 sweeps them in 0.26.

**Why it's needed.** The package's own docs, shipped in the 5.0.10 tarball (`docs/70-perplexity.mdx`), say:

> Perplexity supports Sonar Chat Completions only until September 27, 2026.
> […] staying on version 4 does not preserve service after the Sonar shutdown.

**About version 5:**

- **The 4.x line has ended** (last release 4.0.52).
- **5.x is still settling.** 5.0.0 was published on 2026-09-26, with ten patch releases in the two weeks after.
- **It is not an AI SDK 8 package.** It talks to the Agent API (`/v1/agent`) exclusively:
  - Sonar model ids are no longer mapped. Use the presets (`fast`, `low`, `medium`, `high`, `xhigh`) or ids such as `perplexity/sonar`.
  - Image `file` parts become `input_image`.
  - **PDF parts are no longer supported.**

**Why moving it alone is safe in a release candidate:**

- The Perplexity path is broken today, so this change can only improve it, and no other provider changes.
- 5.0.10 pins `@ai-sdk/provider` 4.0.26 and `provider-utils` 5.0.58, while `ai` 7.0.107 and the other providers pin 4.0.17 and 5.0.45. The lockfile therefore carries **two copies of each until ticket 29**. Both implement the same V4 specification.
- The runtime recognises SDK errors through `APICallError.isInstance` / `NoObjectGeneratedError.isInstance`, which check symbol markers, not `instanceof`. That is true in `ai/runtime/errors.ts`, `temperature-fallback.ts` and `image-parameter-fallback.ts`, so the retry and fallback rules keep working across the two copies.

**Changes in Norish:**

- **Model list.** `packages/shared-server/src/ai/providers/listing.ts` lists five Sonar ids. Replace them with the Agent API presets, keeping vision support: image parts still work, as `input_image`.
- **Connection test.** `packages/auth/src/connection-tests.ts`, in `testPerplexityConnection`, posts to `https://api.perplexity.ai/chat/completions` with `model: "sonar"`. Change it to a minimal Agent API request.
- **Stored model ids.** Admins who picked a Sonar model have it stored in their AI configuration.
  - **Default decision:** map old ids where the stored id is turned into a model, so no data migration is needed: `sonar` → `fast`, `sonar-pro` → `low`, `sonar-reasoning` and `sonar-reasoning-pro` → `medium`, `sonar-deep-research` → `high`. This is the package docs' own suggestion. Say so in an Upgrade note.
  - **Alternative**, if the maintainer prefers: no mapping, and the Upgrade note asks admins to re-pick their model.
- **PDF input.** Check whether any feature sends PDF parts to the language model. If one does, the Perplexity path has to decline them with a clear error instead of failing inside the SDK.
- **Nothing else changes.** `ai/runtime/providers.ts` and `runtime.ts` (schema output and image file parts) need nothing, so everything stays inside `ai/runtime/` (ADR-0015).

## Acceptance criteria

- [ ] **Versions.** In `packages/shared-server/package.json` only `@ai-sdk/perplexity` changes. `pnpm why @ai-sdk/provider` shows the two expected copies and no more.
- [ ] **Model list.** The model picker shows the Agent API presets.
- [ ] **Real-key checks** (manual; the sandbox has no key):
  - the connection test succeeds;
  - a URL import (structured output) works;
  - an image-based import (vision) works.
- [ ] **Stored ids.** Stored Sonar ids are handled per the decision, with a unit test for the mapping (or for the "re-pick" error path).
- [ ] **Existing tests.** The runtime tests pass (temperature fallback, structured output, image generation, transcription), as does the E2E AI project.
- [ ] **Type check.** A strict `tsc --noEmit` on packages/shared-server shows no new errors from the two provider copies.
- [ ] **AI boundary.** An `rg` check shows that no feature file imports `ai` or an `@ai-sdk/*` package.
- [ ] **Release notes.** A bullet under `## Fixes and Improvements` ("Perplexity now uses Perplexity's Agent API; the retired Sonar API stopped working on September 27"), plus an `## Upgrade notes` entry on the model names and what happened to stored choices.

## Comments

- Filed 2026-10-12 with the spec.
- 2026-10-12 — Narrowed for the safe-fixes-only 0.25: only the Perplexity package moves; the AI SDK sweep is ticket 29.
- Sources:
  - the @ai-sdk/perplexity 4.0.48 and 5.0.10 tarballs (docs and CHANGELOG);
  - `npm view` for the pinned provider versions;
  - search summaries of Perplexity's "Sonar moving to Agents API" notice (the page itself was unreachable).
- Confirm the shutdown with a real key before writing the release note. If Sonar still answers, the urgency drops, but the move is still required.
