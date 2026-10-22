import type { Virtualizer } from "@tanstack/react-virtual";

/** The page's own timeline scrolls the window; a panel's scrolls an element. */
type Timeline<TScroll extends Element | Window> = Pick<
  Virtualizer<TScroll, Element>,
  "isScrolling" | "scrollToIndex" | "shouldAdjustScrollPositionOnItemSizeChange"
>;

/**
 * Scrolls a day to the top of the window, holding off TanStack's correction
 * for the days above it while they are measured on the way. The scroll
 * already follows the day to its place, so correcting as well counts their
 * growth twice: iOS applies its deferred correction once the landing has
 * settled, which left today under the status bar.
 */
export function landOnDay<TScroll extends Element | Window>(
  timeline: Timeline<TScroll>,
  index: number
): void {
  timeline.shouldAdjustScrollPositionOnItemSizeChange = () => false;
  timeline.scrollToIndex(index, { align: "start" });
}

/** The virtualizer's `onChange`: once it stops scrolling, TanStack corrects again. */
export function settleLanding<TScroll extends Element | Window>(timeline: Timeline<TScroll>): void {
  if (!timeline.isScrolling) timeline.shouldAdjustScrollPositionOnItemSizeChange = undefined;
}

/**
 * Whether the window has reached the day a landing was for. A timeline loads
 * more at its edges only after that: right after the landing is asked for, the
 * window still shows the top rows, and widening the range there pins the
 * window at the top instead of today. A day outside the range is not waited for.
 */
export function hasReachedDay(items: readonly { index: number }[], index: number): boolean {
  return index < 0 || items.some((item) => item.index === index);
}
