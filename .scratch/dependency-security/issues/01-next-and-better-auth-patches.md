# 01 — Next.js and Better Auth security patches

Status: resolved
Target version: 0.25.0-beta
Blocked by: none

Spec: `.scratch/dependency-security/spec.md`

## What to build

In the `pnpm-workspace.yaml` catalog: `next` 16.3.2 → 16.3.8; `better-auth`, `@better-auth/core`, `@better-auth/api-key`, `@better-auth/expo` 1.6.9 → 1.6.33; `@better-auth/utils` 0.4.0 → 0.4.2.

`createEncryptedEmailAdapter` in `packages/auth/src/auth.ts` returns the user row from an email lookup decrypted (reuse `decryptUser`), so Better Auth's post-sign-in check that the provider's verified email matches the account's email can match, and marks the user verified.

`account_not_linked` joins `ERROR_CODES` on `apps/web/app/(auth)/auth-error/page.tsx` with its message in all fourteen locales' `auth.json`: this email already has a password account, sign in with your password.

## Acceptance criteria

- [ ] `pnpm audit` lists no `next` or `better-auth` advisory.
- [ ] Test: an OAuth sign-in reporting a verified email, into an account already linked to that provider, leaves the user `emailVerified`.
- [ ] Test: the auth-error page shows the `account_not_linked` message for that code.
- [ ] Auth E2E specs pass; password sign-in and an already-linked provider sign-in work as before.
- [ ] `pnpm lint`, `pnpm test:run`, `pnpm i18n:check`, `pnpm build`, `pnpm deps:cycles`, `pnpm format:check` pass.

## Comments

- 2026-10-12: Done. The adapter also decrypts the user joined onto an account lookup: a sign-in through an already-linked provider reads the user that way, past the email branch.
- 2026-10-12: `account_not_linked` reads "This email is already in use." (Mike). Better Auth also returns that code for an OIDC user whose provider omits `email_verified`, so the copy names no sign-in method.
- 2026-10-12: next 16.3.8 wants sharp ^0.35.4, so shared-server and ingredient-icons moved to ^0.35.5 to keep one sharp (and one libvips) in the image.
