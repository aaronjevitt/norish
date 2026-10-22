# 04 — Security section in the 0.25.0 release notes

Status: resolved
Target version: 0.25.0-beta
Blocked by: 01, 02

Spec: `.scratch/dependency-security/spec.md`

## What to build

On `apps/docs/docs/release-notes/0.25.0-beta.md`, a `## Security` section directly under `## Summary` that says to upgrade now and names, in plain words with the GHSA link:

- Next.js: unauthenticated remote code execution through image optimization (GHSA-2xp9-vwfh-vxw4).
- Better Auth: account takeover when someone signs up with a password using another person's email before that person signs in with OIDC, Google or GitHub (GHSA-g38m-r43w-p2q7). Exposed: instances with password sign-up and at least one of those providers.
- The container now runs a current Node 22 on a supported Alpine; the previous image had not received Node security releases since late 2025.

An `## Upgrade notes` line: a user who signed up with a password can no longer start signing in with OIDC, Google or GitHub under the same email; they keep signing in with their password. Users who already sign in with a provider are unaffected.

The test-only and mobile criticals (ticket 03) stay out: they never reached a self-hoster.

## Acceptance criteria

- [ ] Section and upgrade note written, in the glossary's vocabulary.
- [ ] `apps/docs` builds.

## Comments

- 2026-10-12: Done. `## Security` is a one-off beside ADR-0010's section list, as the spec asks.
