# Dependency upgrades: safe fixes in 0.25, the majors in 0.26

Status: ready-for-agent

Researched 2026-10-12 on `rc/0.25.0-beta`. Sources are the npm registry, PyPI, `pnpm audit`, scratch installs and the package tarballs themselves. The vendors' docs sites and GitHub were not reachable from the research sandbox, so breaking changes come from the CHANGELOGs, migration guides and type definitions shipped inside the packages, and from diffing the old tarball against the new one. Where a finding rests on reading code rather than on a reproduced run, the ticket says so.

The maintainer decided the release split on 2026-10-12:

- **0.25.0 takes only safe fixes.**
- **The hard work goes into 0.26.0.**
- **0.26.0 should serve optimized images if possible** (ticket 27).

## Problem Statement

Norish's dependencies have fallen behind far enough that this is a security problem, not a hygiene one.

- `pnpm audit` reports **181 distinct advisories** against the lockfile. 84 sit only in the parked mobile app's Expo tooling. The other 97 (5 critical, 43 high, 37 moderate, 12 low) reach the web app, the shared packages, the landing site or the dev tooling.
- **Next.js 16.3.2** carries three critical remote-code-execution advisories (AVIF decoding in the image optimizer, path handling on Windows hosts, `next/og`), a server-side request forgery in the image optimizer, two cache-poisoning advisories for self-hosted SSG/ISR and three information disclosures. **All are fixed in the patch release 16.3.8.** There is no Next.js 17 on npm, not even as a canary (`canary` is 16.5.0-canary.8), so the newest line is the latest minor, 16.4.0.
- **Better Auth 1.6.9** carries nine advisories, one of them critical. Norish's configuration reaches one: an account takeover through automatic OAuth account linking. It also reaches an open redirect in the Expo plugin that has no advisory. All of these are fixed on the maintained 1.6 line (1.6.33). The latest release, 1.7.7, is a minor by number but a real migration for Norish.
- **sharp 0.35.3** decodes every uploaded and imported image. It has two high advisories (libheif, librsvg), fixed in 0.35.5, and it is the most likely way the AVIF advisory reaches Norish at all.
- **The production image runs Node 22.21.1.** Its base tag `node:22-alpine3.21` stopped receiving builds in October 2025, so the image has missed four Node security releases while CI tests on 22.23.2.
- **The image is not installed from the lockfile.** `pnpm deploy --legacy` re-resolves every dependency from its semver range each time the image is built. A published image therefore contains whatever was current on its build day, not what CI tested.
- **The Perplexity provider is very likely broken today.** Perplexity retired the Sonar Chat Completions API that `@ai-sdk/perplexity` 4 calls on 2026-09-27. Version 5 moves to the Agent API.
- **52 packages have a newer major.** Several of these majors break Norish in ways no gate would catch. The gates don't type-check: apps/web sets `noCheck`, six `typecheck` scripts pass `--noCheck`, and CI has no typecheck step. The BullMQ 6 breakages are also hidden behind mocks.
- **Nothing stops this recurring.** There is no Renovate or Dependabot, and no workflow runs an audit or an image scan.

## Solution

**0.25.0-beta — safe fixes only (tickets 01–06).**

A change belongs in 0.25 only if it meets three conditions:

- it closes an advisory that ships, or fixes something that is broken;
- it stays at patch level within its current line;
- it changes no defaults and nothing visible, beyond what the fix itself forces.

The 0.25 tickets:

- **01:** Next.js 16.3.8, the patch release that carries every fix (16.4 waits for 0.26); sharp 0.35.5; and the image optimizer, which Norish never uses, switched off.
- **02:** Better Auth 1.6.33, on the maintained 1.6 line.
- **03:** security floors for transitive packages (in-major patch releases only), and undici 7.30.
- **04:** the image on a current Node 22.
- **05:** Perplexity on its Agent API. Only that provider changes.
- **06:** the parser's Python lock, security minimums only.

**0.26.0-beta — the hard work (tickets 07–23 and 26–30).** One line per PR, prerequisites first:

- **Next.js and images:** Next.js 16.4 and React 19.3 (26), then images served at the size they're shown (27).
- **Housekeeping:** a lockfile refresh with the dead optional peers removed (28), the AI SDK sweep (29), and the parser's direct dependencies (30).
- **Process:** the CI audit gate and pnpm's supply-chain settings (07).
- **Better Auth:** the zod, tRPC and TanStack Query pins move first (08), then Better Auth 1.7 (09). The account-linking decision is ticket 10.
- **Toolchain:** TypeScript 6 (11), then ESLint 10 (12); Vitest 5 (13); tsdown 0.23 (14).
- **Platform:** Node 24 LTS (15); pnpm 11, with an image built from the lockfile (16).
- **Queue:** the BullMQ scheduler migration (17) ships a release before BullMQ 6 (18).
- **Smaller majors and decisions:** the UI line (19), archiver 8 and dotenv 18 (20), parse-ingredient 3 (21), the docs site (22), and the mobile decision (23).

Tickets 24 and 25 are triage items the research turned up.

**Held lines.** The majors that can't be taken yet are listed below, each with the condition that unblocks it, so nobody has to research them again.

Four rules hold the work together:

1. **0.25 stays at patch level.** A security fix never waits on a major, and a major never rides along with a security fix.
2. **One line per PR.** Each ticket is one PR with its own verification. The lockfile is regenerated by pnpm, never by hand, and a catalog entry moves together with its `overrides` pin.
3. **Prove it beyond the gates.** The gates don't type-check, and some breakages hide behind mocks. So every ticket also runs a real `tsc --noEmit` on the packages it touches, compared against a baseline taken before the change, plus the E2E suite and the manual checks it lists.
4. **Self-hosters read the Upgrade notes.** Anything that changes what a self-hoster configures, sees or must do gets an entry in the Target Version's release notes. Internal-only bumps stay unpublished (ADR-0010).

## Inventory

Only the packages that ship or gate. In-range patch bumps not named here ride along with ticket 28 or the ticket for their workspace.

| Package                                                                                          | Today                              | 0.25 (ticket)             | 0.26 (ticket)                                                    |
| ------------------------------------------------------------------------------------------------ | ---------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| `next`                                                                                           | 16.3.2                             | 16.3.8 (01)               | 16.4.x (26)                                                      |
| `react`, `react-dom`, `@types/react`, `@types/react-dom`                                         | 19.2.3, 19.2.18, 19.2.4            | —                         | 19.3.0 (26)                                                      |
| `next-intl`, `@next/eslint-plugin-next`                                                          | 4.13.7, 16.3.2                     | —                         | 4.14.9, 16.4.x (26)                                              |
| `sharp`                                                                                          | 0.35.3                             | 0.35.5 (01)               | —                                                                |
| image optimizer `/_next/image`                                                                   | on, unused                         | off (01)                  | stays off; Norish serves right-sized images itself (27)          |
| `better-auth`, `@better-auth/core`, `/api-key`, `/expo`                                          | 1.6.9                              | 1.6.33 (02)               | 1.7.x (09)                                                       |
| `@better-auth/utils`                                                                             | 0.4.0                              | 0.4.2 (02); **not** 0.5.0 | —                                                                |
| `undici`                                                                                         | 7.29.0                             | 7.30.0 (03)               | 8 is held                                                        |
| transitive: protobufjs, @grpc/grpc-js, qs, nanoid, lodash, brace-expansion, fast-copy and others | —                                  | security floors (03)      | floors pruned as parents catch up (28)                           |
| `prisma`, `@prisma/client`, `mysql2`, `@esbuild-kit/esm-loader` (unused optional peers)          | in the lockfile                    | —                         | removed (28)                                                     |
| `@testcontainers/*`, `jsdom`, `drizzle-orm`                                                      | 12.1.0, 30.0.1, 0.45.2             | —                         | 12.2.0, 30.1.2, 0.45.4 (28)                                      |
| Node in the image                                                                                | 22.21.1 (alpine3.21)               | 22.23.3 (alpine3.24) (04) | 24 LTS (15)                                                      |
| `@types/node`                                                                                    | 25.9.5                             | —                         | ^24 (15)                                                         |
| `@ai-sdk/perplexity`                                                                             | 4.0.48                             | 5.0.x (05)                | —                                                                |
| `ai`, other `@ai-sdk/*`, `ai-sdk-ollama`                                                         | 7.0.107 and the matching providers | —                         | latest in-major (29)                                             |
| parser-api: lxml, lxml-html-clean, urllib3, anyio, idna, soupsieve                               | see 06                             | patched (06)              | —                                                                |
| parser-api: starlette, fastapi, uvicorn, beautifulsoup4                                          | 0.47.3, 0.136.1, 0.46.0, 4.14.3    | —                         | starlette ≥ 1.3.1 and latest (30)                                |
| `zod`, `@trpc/*`, `@tanstack/react-query`                                                        | 4.4.3, 11.18.0, 5.101.4            | —                         | 4.6.6, 11.19.0, 5.104.2 (08)                                     |
| `typescript`                                                                                     | 5.9.3                              | —                         | 6.0.3 (11); 7.0.2 held (25)                                      |
| `eslint`, `@eslint/js`                                                                           | 9.39.5                             | —                         | 10.12.0, 10.0.1 (12)                                             |
| `vitest`                                                                                         | 4.1.11                             | —                         | 5.0.x (13)                                                       |
| `tsdown`                                                                                         | 0.22.14                            | —                         | 0.23.1 (14)                                                      |
| `pnpm`                                                                                           | 10.34.5                            | —                         | 10.34.6 (11), then 11.x (16)                                     |
| `bullmq`                                                                                         | 5.81.3                             | —                         | 5.81.5 (17), then 6.3.x (18)                                     |
| `@heroui/*`, `react-aria-components`, `motion`, `@scalar/nextjs-api-reference`                   | 3.2.4, 1.20.0, 13.1.1, 0.11.16     | —                         | 3.2.6, 1.22.x, 14.1.0, 0.12.9 (19)                               |
| `archiver` (+ `@types/archiver`), `dotenv`                                                       | 7.0.1 (6.0.4), 17.4.2              | —                         | 8.0.0 (8.0.0), 18.0.x (20)                                       |
| `parse-ingredient`                                                                               | 2.2.0                              | —                         | 3.0.0 (21)                                                       |
| apps/docs (Docusaurus)                                                                           | 3.10.2                             | —                         | in-range refresh (22); 4.0 is canary only                        |
| apps/mobile (Expo SDK)                                                                           | 56                                 | —                         | out of the audit (23); the upgrade belongs to the mobile rewrite |
| `ioredis` 6, `undici` 8, `zod-openapi` 6, `drizzle-orm` 1.0, TypeScript 7                        |                                    | —                         | held; see **Held lines**                                         |

## Implementation Decisions

### Next.js and React

- **0.25 (ticket 01): 16.3.8.**
  - It carries every fix from 16.3.3–16.3.8, changes no defaults, and keeps the same React peer range and Node engine. The npm advisory database reports nothing against it.
  - **sharp 0.35.5 moves with it.** Since 16.3.4, Next declares an optional `sharp ^0.35.4`, and 16.3.8 decodes AVIF again, relying on the patched sharp. Norish's own media pipeline decodes every uploaded and imported AVIF with sharp too.
  - **The image optimizer is switched off with `images: { unoptimized: true }`.** Nothing visible changes, because every `next/image` already renders unoptimized or loads an SVG. `/_next/image` — unauthenticated, since the auth proxy skips `_next` — stops answering.
- **0.26 (ticket 26): 16.4 with React 19.3.** This brings:
  - Next's rewritten internal routing, which matters to Norish's custom server;
  - a new production Turbopack output;
  - a new satori under `next/og`;
  - a coding-agent upgrade nudge that fails `next build` for agents whenever the installed Next has a published advisory.

  React 19.3 moves with it. The App Router always renders with the React that Next bundles, so the installed React matters to Vitest and Testing Library.

### Images served at the size they're shown (0.26)

**What Norish does today.**

- Every recipe, step and cookbook photo is decoded by sharp on the way in and stored as one JPEG of at most 1280×720 (`packages/shared-server/src/media/storage.ts`).
- That same file is served everywhere: the recipe page, a recipe card a few hundred pixels wide, and the smaller planner thumbnail.
- Most photos render through plain `<img>`.
- The service worker's Warm Set caches the exact image URLs the UI requests, for offline use (ADR-0009).

**Why not Next's built-in optimizer.**

- It fetches a local image through an internal request that carries no headers, and so no session cookie: `fetchInternalImage` in `next/dist/server/image-optimizer.js` builds the request with `headers: {}`.
- Norish's photos come from routes behind the auth proxy: `/recipes/[id]/[filename]`, `/recipes/[id]/steps/[filename]`, `/cookbooks/[id]/[filename]` and `/avatars/[id]`. The optimizer would therefore get the sign-in redirect, not the photo.
- Letting it read them would let anyone fetch private photos through `/_next/image`, which the proxy deliberately skips.
- It could only ever serve the public paths: share links, static files and ingredient icons.

**Decision (ticket 27).** Norish serves right-sized images from its own sharp pipeline:

- WebP variants at a small fixed set of widths are written next to each original;
- the existing media routes pick a variant by width, behind the same auth;
- the UI asks for them through `srcset` and a custom `next/image` loader;
- the Warm Set warms the variants;
- a backfill job covers existing libraries.

**`/_next/image` stays closed.** Next answers 404 there whenever `images.loader` is not `'default'` or `images.unoptimized` is set.

**The alternative**, if the maintainer prefers no extra storage and no backfill: resize on demand in the same routes, for fixed widths only, with the result cached on disk.

### Better Auth

- **1.6.33 in 0.25 (ticket 02).** No schema change, no API change for Norish's usage, and it works with the zod 4.4.3 pin. One behaviour changes:
  - Account linking now requires the local user's email to be verified. Norish never verifies password users' emails, so a password user's first SSO login with the same email is refused with `account_not_linked`.
  - The auth-error page needs a message for that code.
  - The option must not be switched off, because that reopens the advisory.
- **1.7 in 0.26 (ticket 09), after the zod pin is lifted (ticket 08).** The 1.7 line requires several changes in Norish:
  - It calls `z.validate()` (zod ≥ 4.5) on every session creation.
  - It requires `increment` and `getAndDelete` on the Redis secondary storage. Without them, every rate-limited request throws.
  - It rewrites the generic OAuth plugin: the client plugin is removed, the account id is read from `sub`, ID tokens are verified, and sign-out goes to the IdP.
  - It moves the OIDC callback to `/api/auth/callback/oidc`. That would break every self-hoster's identity-provider registration unless Norish keeps the old URL working.

  Users stay signed in: the cookie and session formats are unchanged, and no table changes in either step.

- **One takeover path survives every version**, because it is configuration. Norish trusts `oidc`, `google` and `github` for linking even when the provider says the email is unverified. Ticket 10 puts that choice to the maintainer.

### Transitive advisories and the image

- **0.25 (ticket 03): floors only.** Most transitive findings are stale lockfile state, not real constraints: their parents already allow the patched releases.
  - **Range-selector `overrides`** fix them. pnpm matches each selector against the parent's declared range, so only vulnerable ranges move to an in-major patch release.
  - **Blast radius.** In a scratch run the floors changed 42 lockfile packages.
  - **They protect the image too.** The legacy deploy ignores the lockfile, but it does honour `overrides`.
- **0.26 (ticket 28):** remove the unused optional peers (`prisma`, `@prisma/client`, `mysql2`, drizzle-kit's `@esbuild-kit/esm-loader`), refresh within ranges, and prune floors that are no longer needed.
- **0.26 (ticket 16):** build the image from the lockfile, and scan it.

### Runtime platform

- **0.25 (ticket 04): `node:22.23.3-alpine3.24`, pinned exactly.**
  - It is the only route to Node's security releases, because the alpine3.21 tag stopped updating.
  - It is also the riskiest 0.25 change: Alpine moves from 3.21 to 3.24 underneath ffmpeg, the image libraries and Python. So it carries the full image smoke test and a fallback.
- **0.26 (ticket 15): Node 24 LTS**, with `@types/node` following the runtime major. The 25.x types accept Node 23–25 APIs that fail at runtime on Node 22.

### AI SDK

- **0.25 (ticket 05): only `@ai-sdk/perplexity` moves to 5.**
  - It is not an AI SDK 8 package. It moves Perplexity to the Agent API: Sonar model ids are no longer mapped, and PDF parts are no longer accepted.
  - It pins `@ai-sdk/provider` 4.0.26, while `ai` 7.0.107 and the other providers use 4.0.17. The lockfile carries two copies until ticket 29.
  - That is safe: both copies implement the same V4 specification, and the runtime recognises SDK errors through `isInstance` symbol markers, not `instanceof`.
- **0.26 (ticket 29):** every `ai` and `@ai-sdk/*` package moves to its latest in-major version.
- **Both stay inside `ai/runtime/`** (ADR-0015).

### Toolchain

- **TypeScript 6 (ticket 11).** It needs two config fixes: `types` now defaults to `[]`, and side-effect imports are now checked. The lockfile already resolves 6.0.3 for several packages, so this also removes a version split.
- **TypeScript 7 is held (ticket 25).** It is the native compiler and ships no JS compiler API, which typescript-eslint and other tools still require.
- **ESLint 10 (ticket 12).** eslint-plugin-react 7.37.5 crashes on ESLint 10 unless wrapped with `fixupPluginRules`, so wrap it. eslint-plugin-import is registered only to switch a rule off, so delete it (ticket 11).
- **Vitest 5 (ticket 13)** breaks one test file, and its new `clearMocks` default can change others.
- **tsdown 0.23 (ticket 14)** silently ignores one option that `apps/web/tsdown.config.ts` sets.

### Queue

- **BullMQ 6 removes `repeat` from `Queue.add` and removes `Queue.client`.** Norish uses both: the nightly scheduled tasks would run once and never again, and every enrichment enqueue would throw. The tests mock both APIs, so nothing would fail.
- **So the migration happens on BullMQ 5.81.5 first (ticket 17)**, where the new APIs already exist. It must ship at least one release before the major (ticket 18).
- **ioredis stays on 5.** BullMQ 6 accepts it, and BullMQ's own CI still runs on it.

### Smaller majors

- **UI (ticket 19), after React 19.3.** HeroUI 3.2.6 raises its React Aria peers, so they move together. Motion 14 removes only what 13 had already deprecated, but drag in layout changed, so the Reorder UIs get a manual check.
- **archiver 8 (ticket 20)** is ESM-only with named classes, and it drops the lodash and glob chains. **dotenv 18** removes the vault features Norish doesn't use.
- **parse-ingredient 3 (ticket 21)** changes parsing behaviour, including how bulleted lines are read, so it gets regression tests before the bump.

### The satellite apps

- **parser-api** runs in the production image and parses untrusted pages.
  - **0.25 (ticket 06):** the security minimums, all inside their majors: lxml, lxml-html-clean, urllib3, anyio, idna and soupsieve. lxml is the urgent one.
  - **0.26 (ticket 30):** starlette's fixes, which need starlette 1.x, together with FastAPI, uvicorn and beautifulsoup4. The parser listens only on 127.0.0.1.
- **apps/docs (ticket 22)** has no stable major to take. A refresh within the current ranges takes it from 56 advisories to 8, and the deploy job should pin `wrangler`.
- **apps/mobile (ticket 23)** is parked. Its Expo upgrade belongs to the rewrite; what remains is a decision on how its advisories are kept out of the audit.

### Keeping it current

- **Ticket 07 (0.26)** adds a CI audit gate with a reasoned allowlist, turns on pnpm's supply-chain settings (minimum release age, trust policy, no exotic sub-dependencies), and proposes Renovate with weekly lockfile maintenance. Weekly lockfile maintenance is what would have prevented the stale state this research found.
- **Ticket 16** adds an image scan.

### Docs and release notes

- **0.25.0-beta release notes** get a `## Fixes and Improvements` section with these security bullets:
  - the Next.js 16.3.8 update, and the unused image optimization endpoint no longer served (01);
  - the authentication library update (02);
  - Node.js 22.23 in the image (04);
  - the recipe parser's dependency updates (06);
  - Perplexity on the Agent API (05).
- **Their `## Upgrade notes`** cover two changes:
  - password and SSO accounts with the same email are no longer linked automatically (02);
  - what happened to stored Perplexity model choices (05).
- **0.26.0-beta notes** cover:
  - right-sized images and the disk space their variants take (27);
  - the OIDC callback URL, ID-token signing and IdP reachability at startup (09), with `apps/docs/docs/configuration/authentication.md` changing alongside;
  - Node 24 for installs that run outside Docker (15);
  - BullMQ 6 being one-way (18).
- **The toolchain tickets are internal** and stay unpublished.

### Sequence

```
0.25.0-beta (safe fixes only)
  01 Next.js 16.3.8 + sharp 0.35.5 + optimizer off
  02 Better Auth 1.6.33
  03 transitive security floors + undici 7.30
  04 current Node 22 image
  05 Perplexity Agent API (that provider only)
  06 parser lock: security minimums

0.26.0-beta (the hard work)
  01 ──► 26 Next.js 16.4 + React 19.3 ──► 19 UI line
  01 ──► 27 right-sized images
  28 lockfile refresh + dead peers      05 ──► 29 AI SDK sweep      06 ──► 30 parser direct deps
  01, 02, 03 ──► 07 audit gate (allowlist from 23)
  08 zod/tRPC/TanStack ──► 09 Better Auth 1.7        02 ──► 10 linking decision
  11 TypeScript 6 + minors ──► 12 ESLint 10           11 ──► 25 type checking, then TypeScript 7
  13 Vitest 5        14 tsdown 0.23                    04 ──► 15 Node 24
  07, 11 ──► 16 pnpm 11 + lockfile-built image
  17 BullMQ schedulers on 5 ──(one release)──► 18 BullMQ 6
  20 archiver 8 + dotenv 18     21 parse-ingredient 3     22 docs site     23 mobile decision
  24 lazy-worker triage
```

## Held lines and what unblocks them

| Line                           | Why it waits                                                                                                                                                                                                                                                                                      | Unblocked when                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Next.js 17                     | Not released. 16.4 warns that Cache Components and Partial Prefetching become the default in the next major, and Norish's root layout resolves the locale from the database, headers and cookies outside Suspense.                                                                                | 17 ships. Run a Cache Components spike first.                                                                                                     |
| TypeScript 7                   | The `typescript` package is now the native compiler and ships no JS compiler API. typescript-eslint's peer range is `<6.1.0`.                                                                                                                                                                     | typescript-eslint supports TS 7. Until then, side-by-side (ticket 25).                                                                            |
| undici 8                       | The AI transport hands an undici `Agent` to Node's built-in fetch, and undici 8 removed the legacy-handler wrapper that fetch needs ("invalid onRequestStart method"). It also needs Node ≥ 22.19 and turns on HTTP/2 by default. cheerio 1.2.0 and `@ai-sdk/provider-utils` 5 both require `^7`. | cheerio and provider-utils accept 8, and the transport moves to `Dispatcher1Wrapper` or to a fetch that matches the undici version.               |
| ioredis 6                      | RESP3 on by default touches realtime pub/sub, the resume streams and BullMQ's Lua scripts. BullMQ 6 still tests against ioredis 5.                                                                                                                                                                | BullMQ tests against 6. Then a solo PR, starting with `protocol: 2`, and an Upgrade note (Redis ≥ 6.2; compatible servers must accept `HELLO 3`). |
| zod-openapi 6                  | trpc-to-openapi 3.3.0, the latest, requires `^5.4.4`.                                                                                                                                                                                                                                             | A trpc-to-openapi release that accepts 6.                                                                                                         |
| drizzle-orm 1.0                | The newest pre-release is 1.0.0-rc.4 (2026-06-27); there is no stable release. 28 `relations()` and 29 `db.query.*` call sites plus drizzle-kit would move.                                                                                                                                       | 1.0.0 is stable. It then becomes its own effort.                                                                                                  |
| Docusaurus 4                   | Canary only.                                                                                                                                                                                                                                                                                      | A stable 4.0.                                                                                                                                     |
| pnpm 12                        | Native CLI. Support in the CI setup action is unverified.                                                                                                                                                                                                                                         | `pnpm/action-setup` supports it.                                                                                                                  |
| Expo SDK 57, React Native 0.87 | apps/mobile is parked.                                                                                                                                                                                                                                                                            | The mobile rewrite.                                                                                                                               |

## Improvement options

**With the tickets (small, decided per ticket):**

- Switch the unused image optimizer off (01), then serve right-sized images (27).
- Decide on the coding-agent upgrade nudge (26).
- Move the splash route off the deprecated edge runtime (26).
- Give `account_not_linked` its own message (02).
- Add atomic rate-limit storage (09; it can land before the bump).
- Revoke a deleted user's sessions immediately (10).
- Make `@types/node` follow the runtime (15).
- Drop eslint-plugin-import (11).
- Drop the unused type-aware lint project service for faster linting (12).
- Move to Job Schedulers, BullMQ deduplication, and abort AI work when a worker closes (17).
- Send `Cache-Control: no-store` on the API reference page (19).
- Turn on pnpm's supply-chain settings, add the audit gate and Renovate (07).
- Build the image from the lockfile and scan it (16).

**Later, each its own ticket when wanted:**

- **React 19.3 `<ViewTransition>`** for the recipe card → recipe page image and a crossfade between settings tabs. It overlaps with Motion, which 49 files use.
- **`next analyze`** for a one-off client bundle audit covering HeroUI, Motion, dnd-kit and React Aria.
- **Custom server clean-up:**
  - `url.parse` is deprecated in `packages/api/src/startup/http-server.ts`.
  - `serveStaticFile` never serves anything, because `"/"` is in its own exclusion list.
- **Turbopack dev experiments:** lazy dynamic imports and garbage collection.
- **React Compiler**, measured first.
- **typedRoutes**, which is blocked while `noCheck` is on.
- **Better Auth on 1.7:**
  - `requireIdTokenVerification`, since token claims grant server admin and households;
  - IdP logout;
  - `user.validateUserInfo` in place of the registration gate;
  - `authClient.hydrateSession`;
  - a `TRUSTED_PROXIES` setting;
  - no `expo()` while the app is parked.
- **BullMQ 6** typed job progress.
- **undici 8** HTTP/2 to AI providers.
- **parse-ingredient's `extractMeasurements()`** for unit conversion inside step text.
- **OpenAPI 3.2**, through zod-openapi 6.
- **Vitest 5:** its module cache and a root `test.projects` run.
- **Node 24's** `URLPattern` and `RegExp.escape`.

## Non-goals

- Expo, React Native and anything else in apps/mobile beyond keeping it out of the audit (ticket 23). That is the rewrite's job.
- `apps/quick-import-extension`. It is maintained in its own repository.
- Adopting framework features beyond what a ticket lists. They are the follow-ups above.
- The Next.js 17 / Cache Components migration and the drizzle-orm 1.0 migration. They wait for stable releases.

## Open questions

1. **Two 0.25 judgment calls.** Ticket 04 swaps the image's Alpine base underneath Node. Ticket 05 changes an AI provider during the release candidate. Either can move to 0.26 if it is too much for the RC, at a cost:
   - 04 deferred: the image keeps missing Node's security releases until 0.26;
   - 05 deferred: Perplexity stays broken until 0.26.
2. **Backports.** `rc/0.24.0-beta` ships the same Next.js and Better Auth catalog lines (16.3.x and 1.6.9). Is 0.24 still supported? If so, do 01–03 get backported, at their minimum versions of Next.js 16.3.8, Better Auth 1.6.33 and sharp 0.35.5?
3. **Next's coding-agent upgrade nudge.** Switch it off and rely on the CI audit gate, or keep the default (26)?
4. **Stored Perplexity models.** Map them automatically, or ask admins to re-pick (05)?
5. **Account linking.** Which option in ticket 10?
6. **apps/mobile.** Take it out of the pnpm workspace (23)?
7. **Renovate or Dependabot** (07)?
8. **Build-time re-resolution.** Is re-resolving dependencies at image build time intended? The Dockerfile comment calls the legacy deploy "equivalent", which holds for workspace copies but not for versions (16).
9. **The zod pin.** Why is zod pinned at 4.4.3 in `overrides`? It was introduced in `53469908`; record the reason before lifting it (08).
10. **Right-sized images.**
    - Variants written at upload time (the default), or resized on demand?
    - WebP only, or AVIF as well (27)?
