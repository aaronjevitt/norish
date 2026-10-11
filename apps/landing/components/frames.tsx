import type { ReactNode } from "react";

type FrameProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A screenshot in a browser window: a bar of traffic lights and the address it
 * would be at, over a hairline, a radius and a shadow soft enough to read as
 * depth rather than decoration. The chrome is what says "this is the app in a
 * browser" before the capture itself has been read.
 *
 * The bar is a fixed height while the capture under it scales with the column,
 * so nothing here can be expressed as an aspect ratio — the tour sizes its
 * stack off the first frame in it instead (see `.tour-shots` in globals.css).
 */
export function Screen({ children, className }: FrameProps) {
  return (
    <div
      className={`border-border bg-surface overflow-hidden rounded-xl border shadow-[0_40px_90px_-50px_rgb(0_0_0/0.45)] ${className ?? ""}`}
    >
      <div className="border-border bg-surface-secondary/60 flex items-center gap-1.5 border-b px-3 py-2 sm:gap-2 sm:px-4 sm:py-2.5">
        <span className="size-2 rounded-full bg-[#ff5f57] sm:size-2.5" />
        <span className="size-2 rounded-full bg-[#febc2e] sm:size-2.5" />
        <span className="size-2 rounded-full bg-[#28c840] sm:size-2.5" />
        <span className="bg-surface text-muted border-border mx-auto hidden max-w-3xs flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-[11px] sm:flex">
          <LockIcon className="size-3" />
          norish.dev
        </span>
      </div>
      {children}
    </div>
  );
}

/** The padlock in the address bar, at the one size it is ever drawn. */
function LockIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 1a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V6a5 5 0 0 0-5-5Zm3 8H9V6a3 3 0 0 1 6 0v3Z" />
    </svg>
  );
}

/**
 * Thin bezel so a mobile screenshot reads as a phone without a fake notch.
 * Sized for riding along in a corner of the wide capture, so the bezel and
 * radius stay in proportion at a few rem wide.
 */
export function Phone({ children, className }: FrameProps) {
  return (
    <div
      className={`border-border bg-surface overflow-hidden rounded-[1rem] border-[3px] shadow-[0_24px_50px_-24px_rgb(0_0_0/0.55)] md:rounded-[1.35rem] md:border-4 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
