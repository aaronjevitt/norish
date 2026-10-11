"use client";

import { useAutoHide } from "@/hooks/auto-hide";
import { useIsMobile } from "@/hooks/use-is-mobile";

import {
  cssFloatingDockBottomDesktop,
  cssFloatingDockBottomWithNav,
  cssFloatingDockBottomWithShrunkenNav,
  cssFloatingDockStackedBottomWithNav,
  cssFloatingDockStackedBottomWithShrunkenNav,
  MOBILE_NAV_SHRUNKEN_SCALE,
} from "@norish/web/config/css-tokens";

type FloatingDockOptions = {
  /**
   * Where over the nav pill this dock keeps station: either end of it, or
   * centred over the middle of the bar.
   */
  align: "start" | "center" | "end";
  /** Hold the dock at full size whatever the nav does, e.g. while expanded. */
  disabled?: boolean;
  /**
   * Leave with the nav rather than shrinking with it. For a control the reader
   * can come back for at any time — a dock carrying a running timer has
   * something to say while it is scrolled past, and a cook button does not.
   */
  hideWithNav?: boolean;
  /**
   * How high over the nav to keep station. `"row"` is the pill row the cook
   * pill, the add pill and the timer dock stand in; `"stacked"` is the notch
   * just over the bar, where a round control sits on the nav's end cap
   * instead of floating in the row above it.
   */
  station?: "row" | "stacked";
};

/**
 * Geometry for anything floating above `MobileNav`, in one place so the timer
 * dock and the cook pill cannot drift apart.
 *
 * The nav hides by shrinking in place rather than sliding away, so it never
 * vacates the corner and a dock that dropped to the floor would land on top of
 * it. The dock keeps its station above the bar instead and takes the bar's own
 * shrink about the bar's own anchor — slightly smaller, slightly further in —
 * which is what keeps the two aligned at either size.
 */
export function useFloatingDock({
  align,
  disabled = false,
  hideWithNav = false,
  station = "row",
}: FloatingDockOptions) {
  const isMobile = useIsMobile();
  const { isVisible } = useAutoHide({ disabled });

  const isShrunken = isMobile && !isVisible;
  const isHidden = isShrunken && hideWithNav;
  const isStacked = station === "stacked";
  const bottomWithNav = isStacked
    ? cssFloatingDockStackedBottomWithNav
    : cssFloatingDockBottomWithNav;
  const bottomWithShrunkenNav = isStacked
    ? cssFloatingDockStackedBottomWithShrunkenNav
    : cssFloatingDockBottomWithShrunkenNav;

  return {
    isNavVisible: isVisible,
    isHidden,
    /**
     * The row spans the viewport so the shrink pivots on the same centre the
     * nav's does; only the pill inside it takes pointer events.
     */
    className: `pointer-events-none fixed inset-x-0 flex px-4 ${
      align === "end" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"
    }`,
    /** Applied to the pill itself, so a hidden dock cannot swallow a tap. */
    pillClassName: isHidden ? "pointer-events-none" : "pointer-events-auto",
    style: {
      bottom: isMobile ? bottomWithNav : cssFloatingDockBottomDesktop,
      originY: 1,
    },
    animate: isMobile
      ? {
          bottom: isShrunken ? bottomWithShrunkenNav : bottomWithNav,
          scale: isShrunken ? MOBILE_NAV_SHRUNKEN_SCALE : 1,
          opacity: isHidden ? 0 : 1,
          y: isHidden ? 24 : 0,
        }
      : {},
    transition: { duration: 0.25, ease: "easeInOut" as const },
  };
}
