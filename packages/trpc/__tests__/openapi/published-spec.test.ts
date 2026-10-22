// @vitest-environment node

import { describe, expect, it } from "vitest";

import { getOpenApiDocument } from "../../src/openapi";

describe("published OpenAPI spec", () => {
  // The docs site renders this committed copy. When the API changes, refresh it with
  // `pnpm --filter @norish/trpc test published-spec -u` and commit the result.
  it("matches the spec the docs site publishes", async () => {
    await expect(`${JSON.stringify(getOpenApiDocument(), null, 2)}\n`).toMatchFileSnapshot(
      "../../../../apps/docs/docs/reference/openapi.json"
    );
  });
});
