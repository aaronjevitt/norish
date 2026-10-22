import React from "react";

import ThemedShot from "./ThemedShot";

type PhoneMockupProps = {
  /** Base filename without the -light/-dark suffix, e.g. "dashboard-mobile". */
  base: string;
  alt: string;
};

// Phone bezel wrapping a themed mobile screenshot, the landing page's PhoneFrame.
export default function PhoneMockup({ base, alt }: PhoneMockupProps) {
  return (
    <div className="border-surface bg-surface overflow-hidden rounded-[1.75rem] border-6 shadow-[0_30px_60px_-24px_rgb(0_0_0/0.5)]">
      <ThemedShot alt={alt} base={base} />
    </div>
  );
}
