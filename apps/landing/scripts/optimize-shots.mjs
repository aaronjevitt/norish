/*
 * Regenerates `public/screenshots/optimized` from the source captures in
 * `assets/screenshots`. Run it after replacing any capture:
 *
 *   pnpm --filter @norish/landing shots
 *
 * The size table mirrors `components/shot.tsx`: every base is emitted at the
 * widths the page actually requests, in both themes, as webp. Output sizes are
 * exact; a source whose aspect does not match is centre-cropped and called out,
 * because it usually means the capture came from a different window size than
 * the rest of the set (see assets/screenshots/README.md for the capture spec).
 *
 * The hero's dish photo rides along at the end, on the same terms.
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// sharp is not a dependency of the landing page itself; it resolves from the
// monorepo root, where Next.js already brings it along.
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const sourceDir = join(here, "..", "assets", "screenshots");
const outDir = join(here, "..", "public", "screenshots", "optimized");

const WEB = [
  [640, 480],
  [1120, 839],
];
const MOBILE = [
  [192, 381],
  [384, 761],
];

/** Mirrors SHOTS in components/shot.tsx. */
const SHOTS = {
  "dashboard-web": WEB,
  "recipe-web": WEB,
  "cooking-web": WEB,
  "calendar-web": WEB,
  "groceries-web": WEB,
  "dashboard-mobile": MOBILE,
  "recipe-mobile": MOBILE,
  "cooking-mobile": MOBILE,
  "calendar-mobile": MOBILE,
  "groceries-mobile": MOBILE,
};

/*
 * The hero's dish photo, which is a photograph rather than a capture: it is
 * the same recipe the deck opens, cooks and plans, shown in the fragment the
 * hero draws. Its master is 440x195 and nothing larger exists — the recipe's
 * own site publishes it at 440 wide and no bigger — so the 2x variant is an
 * upscale, and takes a little sharpening to keep it off the mushy side. The
 * captures are only ever scaled down and get none.
 */
const HERO = "hero-dish";
const HERO_SIZES = [
  [440, 195],
  [880, 390],
];

const THEMES = ["light", "dark"];
const QUALITY = 82;

await mkdir(outDir, { recursive: true });

let written = 0;
const warnings = [];

/**
 * One source at one size. Anything being made bigger than its master is
 * sharpened afterwards, which resampling on its own leaves soft.
 */
async function emit(image, base, theme, [width, height], master) {
  const out = join(outDir, `${base}-${theme}-${width}.webp`);
  const resized = image.clone().resize(width, height, { fit: "cover", position: "centre" });

  if (width > master.width) resized.sharpen({ sigma: 0.8, m1: 0.5, m2: 0.8 });

  await resized.webp({ quality: QUALITY }).toFile(out);
  written += 1;
}

for (const [base, sizes] of Object.entries({ ...SHOTS, [HERO]: HERO_SIZES })) {
  for (const theme of THEMES) {
    const source = join(sourceDir, `${base}-${theme}.jpg`);

    let image;
    let master;
    try {
      image = sharp(source);
      master = await image.metadata();
      const [targetW, targetH] = sizes[sizes.length - 1];
      const drift = Math.abs(master.width / master.height / (targetW / targetH) - 1);

      if (drift > 0.005) {
        warnings.push(
          `${base}-${theme}.jpg is ${master.width}x${master.height}; expected the ` +
            `${targetW}:${targetH} aspect. Cropped to fit, but the capture likely used ` +
            `the wrong window size.`
        );
      }
    } catch {
      warnings.push(`missing source: ${base}-${theme}.jpg`);
      continue;
    }

    for (const size of sizes) {
      await emit(image, base, theme, size, master);
    }
  }
}

console.log(`wrote ${written} files to public/screenshots/optimized`);

for (const warning of warnings) {
  console.warn(`WARN ${warning}`);
}

if (warnings.length > 0) process.exitCode = 1;
