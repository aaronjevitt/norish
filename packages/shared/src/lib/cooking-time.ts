/**
 * A recipe's time, reconciled for display.
 *
 * `prepMinutes`, `cookMinutes` and `totalMinutes` are three independent
 * columns that nothing derives or validates, so an imported recipe can — and
 * does — store a total its split does not add up to. Rather than quietly
 * redrawing the total to fit the split, the shortfall is shown for what it
 * is: **Other Time**, the part that is neither preparation nor cooking. Its
 * nature is unknown by definition, so it is named for what it is not.
 *
 * The stored total wins, except when the split exceeds it — a specific split
 * beats a rounded total, so there the headline becomes their sum.
 */

export type CookingTimeSegmentKind = "prep" | "cook" | "other" | "total";

export type CookingTimeSegment = {
  kind: CookingTimeSegmentKind;
  minutes: number;
  /** The segment's fraction of the headline total, in [0, 1]. */
  share: number;
};

export type CookingTimeBreakdown = {
  /** The figure the card leads with. */
  totalMinutes: number;
  segments: CookingTimeSegment[];
};

/** Absent, negative and zero all mean "not stored" for a duration. */
function storedMinutes(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * A recipe's times as a headline and the segments that draw inside it, or
 * `null` when the recipe stores no times at all — in which case there is no
 * card to draw.
 */
export function reconcileCookingTime(times: {
  prepMinutes?: number | null;
  cookMinutes?: number | null;
  totalMinutes?: number | null;
}): CookingTimeBreakdown | null {
  const prep = storedMinutes(times.prepMinutes);
  const cook = storedMinutes(times.cookMinutes);
  const total = storedMinutes(times.totalMinutes);
  const split = prep + cook;

  if (split === 0 && total === 0) return null;

  // A specific split beats a rounded total: where they disagree upwards, the
  // headline is the split's own sum.
  const headline = split > total ? split : total;

  const segments: CookingTimeSegment[] = [];

  if (split === 0) {
    segments.push({ kind: "total", minutes: headline, share: 1 });

    return { totalMinutes: headline, segments };
  }

  if (prep > 0) {
    segments.push({ kind: "prep", minutes: prep, share: prep / headline });
  }

  if (cook > 0) {
    segments.push({ kind: "cook", minutes: cook, share: cook / headline });
  }

  const other = headline - split;

  if (other > 0) {
    segments.push({ kind: "other", minutes: other, share: other / headline });
  }

  return { totalMinutes: headline, segments };
}
