// @vitest-environment node
/**
 * The Dish Colour backfill (ADR-0023): recipes stored before the column
 * existed get their colour on startup. Absence of an image is a defined
 * outcome (no colour, theme rendering), an extraction failure leaves the
 * row for the next startup, and nothing that happens here may stop the
 * server from booting.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { backfillDishColors } from "@norish/api/startup/backfill-dish-color";

const { listRecipesMissingDishColor, updateRecipeDishColor, dishColorForImageUrl } = vi.hoisted(
  () => ({
    listRecipesMissingDishColor: vi.fn(),
    updateRecipeDishColor: vi.fn(),
    dishColorForImageUrl: vi.fn(),
  })
);

vi.mock("@norish/db/repositories/recipes", () => ({
  listRecipesMissingDishColor,
  updateRecipeDishColor,
}));

vi.mock("@norish/shared-server/media/dish-color", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@norish/shared-server/media/dish-color")>()),
  dishColorForImageUrl,
}));

vi.mock("@norish/shared-server/logger", () => ({
  dbLogger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("backfillDishColors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("writes a colour for rows with media and skips rows without", async () => {
    listRecipesMissingDishColor.mockResolvedValue([
      { id: "with-gallery", image: null, galleryImages: [{ image: "/recipes/a/1.jpg", order: 0 }] },
      { id: "with-legacy", image: "/recipes/b/2.jpg", galleryImages: [] },
      { id: "bare", image: null, galleryImages: [] },
    ]);
    dishColorForImageUrl.mockResolvedValue("#663311");

    await backfillDishColors();

    expect(dishColorForImageUrl).toHaveBeenCalledWith("/recipes/a/1.jpg");
    expect(dishColorForImageUrl).toHaveBeenCalledWith("/recipes/b/2.jpg");
    expect(updateRecipeDishColor).toHaveBeenCalledWith("with-gallery", "#663311");
    expect(updateRecipeDishColor).toHaveBeenCalledWith("with-legacy", "#663311");
    expect(updateRecipeDishColor).not.toHaveBeenCalledWith("bare", expect.anything());
  });

  it("prefers the first gallery image by order over the legacy column", async () => {
    listRecipesMissingDishColor.mockResolvedValue([
      {
        id: "r1",
        image: "/recipes/r1/legacy.jpg",
        galleryImages: [
          { image: "/recipes/r1/second.jpg", order: 2 },
          { image: "/recipes/r1/hero.jpg", order: 1 },
        ],
      },
    ]);
    dishColorForImageUrl.mockResolvedValue("#112233");

    await backfillDishColors();

    expect(dishColorForImageUrl).toHaveBeenCalledWith("/recipes/r1/hero.jpg");
  });

  it("leaves a row for the next startup when extraction yields nothing", async () => {
    listRecipesMissingDishColor.mockResolvedValue([
      { id: "unreadable", image: "/recipes/c/3.jpg", galleryImages: [] },
    ]);
    dishColorForImageUrl.mockResolvedValue(null);

    await backfillDishColors();

    expect(updateRecipeDishColor).not.toHaveBeenCalled();
  });

  it("continues past a row whose write fails and never throws", async () => {
    listRecipesMissingDishColor.mockResolvedValue([
      { id: "broken", image: "/recipes/d/4.jpg", galleryImages: [] },
      { id: "fine", image: "/recipes/e/5.jpg", galleryImages: [] },
    ]);
    dishColorForImageUrl.mockResolvedValue("#445566");
    updateRecipeDishColor.mockRejectedValueOnce(new Error("db down"));

    await expect(backfillDishColors()).resolves.toBeUndefined();
    expect(updateRecipeDishColor).toHaveBeenCalledWith("fine", "#445566");
  });

  it("survives the listing itself failing", async () => {
    listRecipesMissingDishColor.mockRejectedValue(new Error("no such column"));

    await expect(backfillDishColors()).resolves.toBeUndefined();
  });
});
