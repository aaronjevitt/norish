import React from "react";

import ThemedShot from "./ThemedShot";

type BrowserMockupProps = {
  /** Base filename without the -light/-dark suffix, e.g. "dashboard-web". */
  base: string;
  alt: string;
  url?: string;
};

// macOS-style browser window chrome wrapping a themed screenshot, the
// landing page's BrowserFrame.
export default function BrowserMockup({ base, alt, url = "norish.dev" }: BrowserMockupProps) {
  return (
    <div className="border-border bg-surface overflow-hidden rounded-2xl border shadow-[0_40px_80px_-32px_rgb(0_0_0/0.45)]">
      <div className="border-border bg-surface-secondary/40 flex items-center gap-2 border-b px-4 py-2.5">
        <span className="size-3 flex-none rounded-full bg-[#ff5f57]" />
        <span className="size-3 flex-none rounded-full bg-[#febc2e]" />
        <span className="size-3 flex-none rounded-full bg-[#28c840]" />
        <div className="border-border bg-background text-muted mx-auto rounded-full border px-3.5 py-0.5 text-[11px]">
          {url}
        </div>
      </div>
      <ThemedShot alt={alt} base={base} />
    </div>
  );
}
