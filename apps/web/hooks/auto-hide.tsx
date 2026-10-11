"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "motion/react";

/**
 * The slack in "the reader is at the foot of the page": enough to absorb
 * sub-pixel layout and a browser's own rounding, not enough to fire a screen
 * early.
 */
const BOTTOM_EDGE_TOLERANCE_PX = 8;

/**
 * The last screen of a page reserves room for the nav pill and the dock row
 * floating above it, so at the foot of the page the chrome is covering
 * nothing. A reader who has arrived at the end gets it back at full size and
 * keeps it — shrinking there only takes away controls to buy space that is
 * already spare.
 */
function isAtPageBottom(scrollTop: number = window.scrollY) {
  return (
    scrollTop + window.innerHeight >=
    document.documentElement.scrollHeight - BOTTOM_EDGE_TOLERANCE_PX
  );
}

interface AutoHideOptions {
  scrollThreshold?: number;
  idleDelay?: number;
  topOffset?: number;
  disabled?: boolean;
}

export function useAutoHide({
  scrollThreshold = 2,
  idleDelay = 4000,
  topOffset = 50,
  disabled = false,
}: AutoHideOptions = {}) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);
  // Use ref instead of state to avoid re-renders when scrollability changes
  const isScrollableRef = useRef(true);

  // Brief pause after route change to ignore scroll restoration
  const ignoreScrollUntil = useRef(0);

  // Store disabled in ref to avoid callback dependency changes
  const disabledRef = useRef(disabled);

  disabledRef.current = disabled;

  // Check if page is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      const hasVerticalScroll = document.documentElement.scrollHeight > window.innerHeight;
      const wasScrollable = isScrollableRef.current;

      isScrollableRef.current = hasVerticalScroll;

      // If became non-scrollable, show navbar
      if (wasScrollable && !hasVerticalScroll) {
        setIsVisible(true);
      }

      // A page can also shrink under a reader who is already scrolled — one
      // deleted row is enough — leaving them at the foot of it with no scroll
      // event to notice by.
      if (isAtPageBottom()) {
        setIsVisible(true);
      }
    };

    checkScrollable();
    window.addEventListener("resize", checkScrollable);

    // Check scrollability periodically instead of on every DOM mutation
    // This avoids performance issues with virtualized lists that constantly update DOM
    const intervalId = setInterval(checkScrollable, 1000);

    return () => {
      window.removeEventListener("resize", checkScrollable);
      clearInterval(intervalId);
    };
  }, []);

  // Stable callbacks that read from refs
  const show = useCallback(() => {
    if (disabledRef.current) return;
    setIsVisible(true);
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
  }, []);

  const hide = useCallback(() => {
    if (disabledRef.current || !isScrollableRef.current) return;
    // Guarded here rather than at each call site, so the idle timer and the
    // hover timer cannot shrink the chrome at the foot of the page either.
    if (isAtPageBottom()) return;
    if (!isHoveringRef.current) {
      setIsVisible(false);
    }
  }, []);

  // Reset state on route change - show nav and ignore scroll events briefly
  useEffect(() => {
    setIsVisible(true);
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = null;
    }
    // Reset lastScrollY immediately to current position to prevent
    // scroll events from previous page affecting the new page
    lastScrollY.current = scrollY.get();
    // Ignore scroll events for 1000ms to let virtual list content settle
    ignoreScrollUntil.current = Date.now() + 1000;

    return () => {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [pathname, scrollY]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = lastScrollY.current;
    const diff = latest - prev;

    if (disabledRef.current || !isScrollableRef.current) {
      lastScrollY.current = latest;

      return;
    }

    // Ignore scroll events during route change scroll restoration
    if (Date.now() < ignoreScrollUntil.current) {
      lastScrollY.current = latest;

      return;
    }

    // Always visible near top
    if (latest < topOffset) {
      show();
      lastScrollY.current = latest;

      return;
    }

    // And at the foot of the page, where the reserved space means the chrome
    // is in nobody's way. `show()` also drops any idle hide already pending.
    if (isAtPageBottom(latest)) {
      show();
      lastScrollY.current = latest;

      return;
    }

    if (Math.abs(diff) > scrollThreshold) {
      if (diff > 0) hide();
      else show();
    }

    lastScrollY.current = latest;

    // Only set idle timeout if idleDelay is a valid finite number > 0
    if (idleDelay > 0 && isFinite(idleDelay)) {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        if (latest > topOffset) hide();
      }, idleDelay);
    }
  });

  // Clear timeout and stay visible when disabled
  useEffect(() => {
    if (disabled) {
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = null;
      }
      setIsVisible(true);
    }
  }, [disabled]);

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  const onHoverStart = useCallback(() => {
    isHoveringRef.current = true;
    show();
  }, [show]);

  const onHoverEnd = useCallback(() => {
    isHoveringRef.current = false;
    const currentScroll = scrollY.get();

    if (currentScroll > topOffset && isScrollableRef.current) {
      scrollTimeout.current = setTimeout(() => hide(), idleDelay);
    }
  }, [hide, idleDelay, scrollY, topOffset]);

  return {
    isVisible,
    show,
    hide,
    onHoverStart,
    onHoverEnd,
  };
}
