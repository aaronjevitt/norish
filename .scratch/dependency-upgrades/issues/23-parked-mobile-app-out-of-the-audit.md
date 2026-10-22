# 23 — The parked mobile app stops counting against the audit

Status: needs-triage
Blocked by: None — can start immediately
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

84 of the 181 advisories in the audit sit only in apps/mobile's Expo, Metro and React Native tooling, including:

- shell-quote (critical);
- @xmldom/xmldom, svgo, ws 7, node-forge, braces, compression and image-size;
- uuid 7, decode-uri-component and nanoid 3.

**None of it ships.** The image deploys only `@norish/web`'s production dependencies.

**But it still costs something:**

- The Expo cluster is linked into `packages/auth` through `@better-auth/expo`'s optional peers.
- It keeps ticket 07's audit gate noisy.
- It makes every audit read worse than the shipped product is.

The Expo SDK 56 → 57 upgrade belongs to the mobile rewrite, not to this effort.

**Decision needed. Options:**

1. **Leave it for the rewrite.** Allowlist the advisories in the audit gate.
2. **Add seven in-major overrides.** These were tested:
   - `"@xmldom/xmldom@>=0.8.0 <0.8.15": ^0.8.15`
   - `"brace-expansion@>=5.0.0 <5.0.12": ^5.0.12`
   - `"compression@<1.8.2": ^1.8.2`
   - `"nanoid@<3.3.18": ^3.3.18`
   - `"shell-quote@<1.11.0": ^1.11.0`
   - `"svgo@>=3.0.0 <3.3.5": ^3.3.5`
   - `"ws@>=7.0.0 <7.5.11": ^7.5.11`

   Left afterwards: braces and node-forge (no fix exists), and uuid 7, decode-uri-component and image-size (fixed only in new majors).

3. **Take apps/mobile out of the pnpm workspace** — `"!apps/mobile"` in `pnpm-workspace.yaml`, as apps/docs already is — and re-lock from scratch. A lockfile-only install keeps the stale Expo peers, so the full re-lock is needed.
   - Afterwards only braces remains, via `@next/eslint-plugin-next` › fast-glob: dev-only, with no fix.
   - `pnpm dev:mobile` would need its own install inside apps/mobile.
   - Consider at the same time not mounting `expo()` in `packages/auth/src/auth.ts`, and dropping `@better-auth/expo` while the app is parked. Then no production server exposes the Expo authorization proxy at all. Ticket 02 fixed the open redirect it carried, but the endpoint has no user.

**Recommendation: option 3.** It matches what "parked" means, removes the noise, and the rewrite starts from a clean slate.

## Acceptance criteria (once decided)

- [ ] **Audit.** `pnpm audit` reflects only what the decision keeps, and ticket 07's allowlist is updated to match.
- [ ] **Docs.** For option 3: `AGENTS.md`'s apps/mobile note and `CONTRIBUTING.md` say how to install and start the parked app, and `pnpm dev:mobile` still starts it.
- [ ] **Gates.** The repo gates pass.

## Comments

- Filed 2026-10-12 with the spec.
