import { describe, expect, it } from "vitest";

import { reconcileCookingTime } from "@norish/shared/lib/cooking-time";

/**
 * The three columns are independent and nothing validates them, so every
 * case below is real data rather than a hypothetical.
 */
describe("reconcileCookingTime", () => {
  it("draws an agreeing split inside its total", () => {
    const result = reconcileCookingTime({ prepMinutes: 10, cookMinutes: 20, totalMinutes: 30 });

    expect(result).toEqual({
      totalMinutes: 30,
      segments: [
        { kind: "prep", minutes: 10, share: 10 / 30 },
        { kind: "cook", minutes: 20, share: 20 / 30 },
      ],
    });
  });

  it("shows the shortfall as Other Time rather than redrawing the total", () => {
    // A two-hour prove is exactly the case a rounding decision would swallow.
    const result = reconcileCookingTime({ prepMinutes: 20, cookMinutes: 40, totalMinutes: 180 });

    expect(result?.totalMinutes).toBe(180);
    expect(result?.segments.map((segment) => [segment.kind, segment.minutes])).toEqual([
      ["prep", 20],
      ["cook", 40],
      ["other", 120],
    ]);
  });

  it("lets an overflowing split win, and the headline becomes its sum", () => {
    const result = reconcileCookingTime({ prepMinutes: 30, cookMinutes: 45, totalMinutes: 60 });

    expect(result?.totalMinutes).toBe(75);
    expect(result?.segments.map((segment) => segment.kind)).toEqual(["prep", "cook"]);
  });

  it("draws a total with no split as one filled segment", () => {
    const result = reconcileCookingTime({ totalMinutes: 45 });

    expect(result).toEqual({
      totalMinutes: 45,
      segments: [{ kind: "total", minutes: 45, share: 1 }],
    });
  });

  it("takes the total from a split with no stored total", () => {
    const result = reconcileCookingTime({ prepMinutes: 15, cookMinutes: 25 });

    expect(result?.totalMinutes).toBe(40);
    expect(result?.segments.map((segment) => segment.kind)).toEqual(["prep", "cook"]);
  });

  it("draws a half split on its own", () => {
    const result = reconcileCookingTime({ cookMinutes: 25 });

    expect(result).toEqual({
      totalMinutes: 25,
      segments: [{ kind: "cook", minutes: 25, share: 1 }],
    });
  });

  it("never names the remainder when the split fills the total exactly", () => {
    const result = reconcileCookingTime({ prepMinutes: 5, cookMinutes: 5, totalMinutes: 10 });

    expect(result?.segments.some((segment) => segment.kind === "other")).toBe(false);
  });

  it("has nothing to draw when the recipe stores no times", () => {
    expect(reconcileCookingTime({})).toBeNull();
    expect(
      reconcileCookingTime({ prepMinutes: null, cookMinutes: null, totalMinutes: null })
    ).toBeNull();
  });

  it("treats a zero or negative duration as not stored", () => {
    expect(reconcileCookingTime({ prepMinutes: 0, cookMinutes: 0, totalMinutes: 0 })).toBeNull();
    expect(reconcileCookingTime({ prepMinutes: -10, totalMinutes: 30 })).toEqual({
      totalMinutes: 30,
      segments: [{ kind: "total", minutes: 30, share: 1 }],
    });
  });

  it("shares always add up to the headline", () => {
    const result = reconcileCookingTime({ prepMinutes: 20, cookMinutes: 40, totalMinutes: 180 });
    const shares = result!.segments.reduce((sum, segment) => sum + segment.share, 0);

    expect(shares).toBeCloseTo(1);
  });
});
