// @vitest-environment node

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { ImageGenerationConfig } from "@norish/config/zod/server-config";
import { ServerConfigKeys } from "@norish/config/zod/server-config";
import { getConfig, setConfig } from "@norish/db/repositories/server-config";
import { serverConfig } from "@norish/db/schema";

import { getTestDb } from "../../../helpers/db-test-helpers";
import { RepositoryTestBase } from "../../../helpers/repository-test-base";

const IMAGE_KEY = ServerConfigKeys.IMAGE_GENERATION_CONFIG;

async function readWithSecrets(): Promise<ImageGenerationConfig | null> {
  return await getConfig<ImageGenerationConfig>(IMAGE_KEY, true);
}

describe("server config secrets", () => {
  const testBase = new RepositoryTestBase("server_config_secrets");

  beforeAll(async () => {
    await testBase.setup();
  });

  beforeEach(async () => {
    await testBase.beforeEachTest();
    await getTestDb().delete(serverConfig);
    await setConfig(
      IMAGE_KEY,
      { provider: "openai", model: "gpt-image-1", apiKey: "openai-key" },
      null,
      true
    );
  });

  afterAll(async () => {
    await testBase.teardown();
  });

  it("keeps a stored secret when the new value omits it", async () => {
    await setConfig(IMAGE_KEY, { provider: "openai", model: "gpt-image-1" }, null, true);

    expect((await readWithSecrets())?.apiKey).toBe("openai-key");
  });

  it("forgets a dropped secret rather than preserving it", async () => {
    await setConfig(IMAGE_KEY, { provider: "google", model: "imagen-4" }, null, true, {
      dropSecrets: ["apiKey"],
    });

    const stored = await readWithSecrets();

    // A key issued by one provider is not a credential for the next one, and
    // leaving it behind is what stopped Image Generation falling back to the
    // AI configuration's key after a provider change.
    expect(stored?.apiKey).toBeUndefined();
    expect(stored?.provider).toBe("google");
  });

  it("still takes a new secret supplied alongside a drop", async () => {
    await setConfig(
      IMAGE_KEY,
      { provider: "google", model: "imagen-4", apiKey: "google-key" },
      null,
      true,
      { dropSecrets: ["apiKey"] }
    );

    expect((await readWithSecrets())?.apiKey).toBe("google-key");
  });
});
