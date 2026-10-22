// @vitest-environment node
import { handleOAuthUserInfo } from "better-auth/oauth2";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@norish/auth/auth";
import { setAuthProviderCache } from "@norish/auth/provider-cache";

// The real auth config, with Better Auth's memory adapter standing in for Postgres
// and a Map for Redis, so the encrypted-email adapter and the hooks run as shipped.
const { store, redis } = vi.hoisted(() => ({
  store: { user: [], session: [], account: [], verification: [], apikey: [] } as Record<
    string,
    unknown[]
  >,
  redis: new Map<string, string>(),
}));

vi.mock("better-auth/adapters/drizzle", async () => {
  const { memoryAdapter } = await import("better-auth/adapters/memory");

  return { drizzleAdapter: () => memoryAdapter(store) };
});

vi.mock("@norish/db/drizzle", () => ({ db: {} }));
vi.mock("@norish/db/repositories/api-keys", () => ({ setApiKeyAuthService: vi.fn() }));
vi.mock("@norish/db/repositories/server-config", () => ({ setConfig: vi.fn() }));
vi.mock("@norish/db/repositories/users", () => ({ countUsers: vi.fn().mockResolvedValue(2) }));
vi.mock("@norish/shared-server/config/server-config-loader", () => ({
  isRegistrationEnabled: vi.fn().mockResolvedValue(true),
}));
vi.mock("@norish/auth/claim-processor", () => ({
  getPendingOIDCProfile: vi.fn(),
  mergeOIDCTokenClaims: vi.fn(),
  processClaimsForUser: vi.fn(),
  storeOIDCProfile: vi.fn(),
}));
vi.mock("@norish/shared-server/logger", () => ({
  authLogger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@norish/shared-server/redis/client", () => ({
  getPublisherClient: async () => ({
    get: async (key: string) => redis.get(key) ?? null,
    set: async (key: string, value: string) => redis.set(key, value),
    setex: async (key: string, _ttl: number, value: string) => redis.set(key, value),
    del: async (key: string) => redis.delete(key),
  }),
}));

const EMAIL = "ada@example.com";

async function context() {
  return auth.$context;
}

async function signInWith(providerId: string, accountId: string) {
  return handleOAuthUserInfo(
    { context: await context() } as unknown as Parameters<typeof handleOAuthUserInfo>[0],
    {
      userInfo: { id: accountId, email: EMAIL, emailVerified: true, name: "Ada" },
      account: { providerId, accountId },
    }
  );
}

async function findUser(id: string) {
  return (await context()).internalAdapter.findUserById(id);
}

async function providersOf(userId: string) {
  const accounts = await (await context()).internalAdapter.findAccounts(userId);

  return accounts.map((account) => account.providerId).sort();
}

beforeAll(() => {
  setAuthProviderCache({
    github: { clientId: "github-id", clientSecret: "github-secret", isOverridden: false },
    google: { clientId: "google-id", clientSecret: "google-secret", isOverridden: false },
    oidc: null,
    passwordEnabled: true,
  });
});

beforeEach(() => {
  for (const rows of Object.values(store)) rows.length = 0;
  redis.clear();
});

describe("OAuth sign-in over encrypted emails", () => {
  it("marks a user verified when a linked provider reports the same verified email", async () => {
    const { user } = await (
      await context()
    ).internalAdapter.createOAuthUser(
      { email: EMAIL, name: "Ada", emailVerified: false },
      { providerId: "google", accountId: "google-1" }
    );

    const result = await signInWith("google", "google-1");

    expect(result.error).toBeNull();
    expect((await findUser(user.id))?.emailVerified).toBe(true);
  });

  it("auto-links another trusted provider once the email is verified", async () => {
    const { user } = await (
      await context()
    ).internalAdapter.createOAuthUser(
      { email: EMAIL, name: "Ada", emailVerified: false },
      { providerId: "google", accountId: "google-1" }
    );

    await signInWith("google", "google-1");
    const result = await signInWith("github", "github-1");

    expect(result.error).toBeNull();
    expect(result.data?.user.id).toBe(user.id);
    expect(await providersOf(user.id)).toEqual(["github", "google"]);
  });

  it("refuses to link a provider to a password account, whose email nobody verified", async () => {
    const ctx = await context();
    const user = await ctx.internalAdapter.createUser({
      email: EMAIL,
      name: "Ada",
      emailVerified: false,
    });

    await ctx.internalAdapter.linkAccount({
      userId: user.id,
      providerId: "credential",
      accountId: user.id,
      password: "hashed",
    });

    const result = await signInWith("google", "google-1");

    expect(result.error).toBe("account not linked");
    expect(await providersOf(user.id)).toEqual(["credential"]);
    expect((await findUser(user.id))?.emailVerified).toBe(false);
  });
});
