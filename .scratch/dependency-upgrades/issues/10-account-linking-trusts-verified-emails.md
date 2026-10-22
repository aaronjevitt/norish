# 10 — Account linking trusts only verified emails

Status: needs-triage
Blocked by: 02
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

After ticket 02 one takeover path remains. No Better Auth version closes it, because it is configuration:

- `packages/auth/src/auth.ts` sets `accountLinking.trustedProviders: ["oidc", "google", "github"]`. That links an OAuth identity into an existing local user even when the provider reports the email as unverified.
- Norish's OIDC `getUserInfo` maps `emailVerified: email_verified ?? false`. So an IdP that doesn't send `email_verified` produces unverified identities that are still trusted for linking.

**Decision needed. Options:**

1. **Drop `"oidc"` from `trustedProviders`.** Possibly drop `"github"` too; whether GitHub can return an unverified primary email is unconfirmed. Linking then requires the provider to say the email is verified.
   - Cost: self-hosted IdPs that don't send `email_verified` can no longer link to existing accounts automatically. New users are unaffected.
2. **Keep it, behind a setting.** Keep `"oidc"` trusted only when an admin opts in, through an environment variable such as `OIDC_TRUST_EMAIL` or an admin setting. Default off, and documented.
3. **Keep it as it is**, and document the risk: the admin chooses which IdP to trust.

Whichever option is chosen, also revoke a deleted user's Redis sessions immediately. `packages/shared-server/src/accounts/deletion.ts` should call `internalAdapter.deleteSessions(userId)`; today sessions are only revoked lazily, on the next request.

## Acceptance criteria (once decided)

- [ ] **Linking tests.** Tests cover linking with a verified and an unverified email for each provider.
- [ ] **Session revocation.** A deleted user's sessions are gone straight away, with a test.
- [ ] **Docs.** If behaviour changes: `apps/docs/docs/configuration/authentication.md` and an Upgrade note. If the option adds a variable: `.env.example` and the configuration page too.

## Comments

- Filed 2026-10-12 with the spec.
