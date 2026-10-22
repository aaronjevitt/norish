# 09 — Better Auth 1.7

Status: ready-for-agent
Blocked by: 02, 08
Target release: 0.26.0-beta

Spec: `.scratch/dependency-upgrades/spec.md`

## What to build

Move every `@better-auth/*` package and `better-auth` to the 1.7 line (1.7.7 at research time). `@better-auth/utils` stays at 0.4.2, which is still the exact peer.

For Norish, 1.7 is a migration, not a bump. Each item below comes from the 1.7.7 tarball diff and the 1.7 upgrade guide.

1. **The Redis secondary storage gains `increment` and `getAndDelete`** (`packages/auth/src/auth.ts`, `secondaryStorage`).
   - **Why.** Without `increment`, every rate-limited `/api/auth` request throws ("Secondary-storage rate limiting requires SecondaryStorage.increment").
   - **How.**
     - Use `GETDEL` (Redis ≥ 6.2; compose ships 8.10.1).
     - Use `INCR` with the expiry set on the first increment, through Lua or `MULTI`.
     - **Prefix the new counter keys.** The existing `ip|path` rate-limit keys hold JSON, so `INCR` on them would error during the first window after deploy.
   - **Landing early.** This part can land before the bump: on 1.6.33 it makes rate limiting atomic.
2. **The generic OAuth plugin was rewritten.**
   - **Removed.** The plugin's own endpoints (`/sign-in/oauth2`, `/oauth2/callback/:providerId`, `/oauth2/link`) are gone, and so is `genericOAuthClient`.
   - **Client side.** Drop `genericOAuthClient` from `apps/web/lib/auth/client.ts` and `packages/shared/src/lib/auth/client.ts`.
   - **Sign-in calls.** `signIn.oauth2(...)` becomes `signIn.social({ provider: "oidc" })` at `apps/web/app/(auth)/login/components/provider-button.tsx` and `auto-sign-in.tsx`.
3. **The OIDC callback URL moves.** It becomes `/api/auth/callback/oidc`; today it is `/api/auth/oauth2/callback/oidc`, as documented in `apps/docs/docs/configuration/authentication.md`.
   - **Impact.** Every self-hoster's identity-provider registration breaks unless Norish keeps the old URL working.
   - **The compat path.**
     - Set `redirectURI` to the legacy URL. Core uses `options.redirectURI` for both the authorize step and the token exchange.
     - Route `/api/auth/oauth2/callback/[id]` to `/api/auth/callback/[id]`.

     This is untested, so prove it with an OIDC test.

   - **Default decision.** Keep the old URL working for at least one release, document the new one, and deprecate the old one later.
4. **The account id is read from `profile.sub`** for discovery providers. Norish's custom `getUserInfo` returns only `id`, so every OIDC login would fail with `unable_to_get_user_info`. Return `sub` as well. It is the same value, so existing `account` rows still match.
5. **ID tokens are verified** against the discovery JWKS, issuer, audience and nonce. HS256-signed ID tokens fail; an Authentik provider without a signing key does this, though that is unverified. → Upgrade note.
6. **Discovery is fetched once, at startup.** If the IdP is down at that moment, OIDC stays disabled until Norish restarts. → Upgrade note. A retry is a possible follow-up.
7. **Sign-out redirects to the IdP's end-session URL.** That races Norish's own `window.location.href = "/login?logout=true"` (`apps/web/context/user-context.tsx`). Set `disableProviderLogout: true`; IdP logout is a later improvement.

**Not breaking:**

- Cookie names and signing, the Redis session format and the session defaults are unchanged, so users stay signed in. Only OAuth logins that are in flight at deploy time fail.
- No table or column changes; the `apikey` schema is identical too.
- `oidcProvider` and MCP moved to separate packages, which Norish doesn't use.
- `experimental.joins` became `advanced.database.joins`, and stays off.
- `rateLimit.customStorage` now takes only `consume`, which Norish doesn't use.
- `getIp` is renamed `getIP`; Norish doesn't import it.
- Origin and relative-URL checks are stricter; Norish uses plain paths.
- `validateSchema` is skipped, because the encrypted-email adapter wrapper is a new object.
- The api-key plugin is unchanged.

## Acceptance criteria

- [ ] **Versions.** Every `@better-auth/*` package is on 1.7.x and utils on 0.4.2, with one copy each.
- [ ] **Rate limiting is tested with the limiter on.** The new storage methods have unit tests, and at least one automated run has rate limiting on: `AUTH_RATE_LIMIT_ENABLED=true` in an integration test or an E2E variant. The E2E harness turns it off (`production-stack.ts`), so the suite can't catch item 1 as it stands.
- [ ] **OIDC end to end:**
  - first login;
  - returning login, matching the existing account row;
  - the legacy redirect URI still works;
  - an IdP that is down at startup behaves as documented;
  - sign-out lands on `/login`.
- [ ] **Unchanged flows.** GitHub, Google, password and API keys (REST and WebSocket) behave as before.
- [ ] **Schema.** `pnpm db:generate` produces no migration.
- [ ] **Gates and type check.** The gates and E2E pass, and a strict `tsc --noEmit` on packages/auth shows no new errors.
- [ ] **Docs and Upgrade notes.**
  - `authentication.md` shows the new callback URL, and the legacy one for as long as it works.
  - The 0.26 Upgrade notes cover: ID tokens must be RS- or ES-signed; the IdP must be reachable when Norish starts; sign-out no longer ends the IdP session.

## Comments

- Filed 2026-10-12 with the spec.
- Later improvements, out of scope here:
  - `requireIdTokenVerification: true`, since token claims grant server admin and households;
  - IdP logout through `postLogoutRedirectURI`;
  - `user.validateUserInfo` in place of the registration gate in `databaseHooks.user.create.before`;
  - `authClient.hydrateSession`, to skip the first `/get-session`;
  - a `TRUSTED_PROXIES` setting mapped to `advanced.ipAddress.trustedProxies`.
