import React, { useRef } from "react";
import { useColorMode } from "@docusaurus/theme-common";
import useIsBrowser from "@docusaurus/useIsBrowser";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { flushSync } from "react-dom";

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

/**
 * Light/dark switch, as on norish.dev: where the View Transition API exists the
 * new theme sweeps out from this button as a growing circle; everywhere else,
 * and under reduced motion, it just switches.
 */
export default function ThemeToggle() {
  const { colorMode, setColorMode } = useColorMode();
  const isBrowser = useIsBrowser();
  const button = useRef<HTMLButtonElement>(null);

  const isDark = colorMode === "dark";

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    const doc = document as DocumentWithViewTransition;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!doc.startViewTransition || reduced || !button.current) {
      setColorMode(next);

      return;
    }

    // The circle grows from the button itself, reaching the farthest corner.
    const { left, top, width, height } = button.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const root = document.documentElement.style;

    root.setProperty("--theme-reveal-x", `${x}px`);
    root.setProperty("--theme-reveal-y", `${y}px`);
    root.setProperty("--theme-reveal-r", `${radius}px`);

    doc.startViewTransition(() => {
      flushSync(() => setColorMode(next));
    });
  };

  return (
    <Button
      ref={button}
      isIconOnly
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      size="sm"
      variant="ghost"
      onPress={toggle}
    >
      {/* The stored theme is only known in the browser; until then the icon is blank. */}
      {!isBrowser ? (
        <span className="size-4.5" />
      ) : isDark ? (
        <SunIcon className="size-4.5" />
      ) : (
        <MoonIcon className="size-4.5" />
      )}
    </Button>
  );
}
