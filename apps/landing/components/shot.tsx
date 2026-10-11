import { asset } from "@/lib/assets";

/**
 * Intrinsic size of the largest variant plus the widths that exist on disk.
 * Every shot is pre-rendered at these sizes under `public/screenshots/optimized`,
 * so nothing is resized at request time and no image optimizer is involved.
 */
const SHOTS = {
  "dashboard-web": { widths: [640, 1120], width: 1120, height: 839 },
  "recipe-web": { widths: [640, 1120], width: 1120, height: 839 },
  "cooking-web": { widths: [640, 1120], width: 1120, height: 839 },
  "calendar-web": { widths: [640, 1120], width: 1120, height: 839 },
  "groceries-web": { widths: [640, 1120], width: 1120, height: 839 },
  "dashboard-mobile": { widths: [192, 384], width: 384, height: 761 },
  "recipe-mobile": { widths: [192, 384], width: 384, height: 761 },
  "cooking-mobile": { widths: [192, 384], width: 384, height: 761 },
  "calendar-mobile": { widths: [192, 384], width: 384, height: 761 },
  "groceries-mobile": { widths: [192, 384], width: 384, height: 761 },
  // Not a capture but a photograph, and the only one on the page: the dish in
  // the hero's recipe fragment. Its master is 440 wide, so the second width is
  // an upscale the optimizer sharpens rather than detail that exists.
  "hero-dish": { widths: [440, 880], width: 880, height: 390 },
} as const;

type ShotProps = {
  base: keyof typeof SHOTS;
  alt: string;
  /** Rendered width hint for the browser's variant pick, e.g. "(min-width: 64rem) 34rem, 90vw". */
  sizes: string;
  className?: string;
};

function srcSet(base: string, theme: "light" | "dark", widths: readonly number[]) {
  return widths
    .map((width) => `${asset(`/screenshots/optimized/${base}-${theme}-${width}.webp`)} ${width}w`)
    .join(", ");
}

/**
 * A product screenshot in whichever theme is active.
 *
 * Both variants are in the markup and swapped with CSS, so the right one is on
 * screen before first paint with no hydration flash. Because the inactive
 * variant is `display: none`, a lazy loader never fetches it — only one image
 * is ever downloaded.
 */
export function Shot({ base, alt, sizes, className }: ShotProps) {
  const { widths, width, height } = SHOTS[base];
  const shared = { width, height, sizes, loading: "lazy", decoding: "async" } as const;

  return (
    <>
      <img
        {...shared}
        alt={alt}
        className={`block dark:hidden ${className ?? ""}`}
        src={asset(`/screenshots/optimized/${base}-light-${width}.webp`)}
        srcSet={srcSet(base, "light", widths)}
      />
      <img
        {...shared}
        alt={alt}
        className={`hidden dark:block ${className ?? ""}`}
        src={asset(`/screenshots/optimized/${base}-dark-${width}.webp`)}
        srcSet={srcSet(base, "dark", widths)}
      />
    </>
  );
}
