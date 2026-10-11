// @vitest-environment node

/**
 * The tint's safety argument, pinned at the source (ADR-0023): inside the
 * `[data-dish-tint]` scope only the page background and the card surfaces
 * are rebuilt, each from its own untinted token's lightness — so a recipe
 * decides what colour its page is and never decides how readable it is,
 * and borders, text and the accent cannot start moving without this suite
 * noticing. Prior art for a source-reading gate: design-invariants.test.ts.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const globalsCss = fs.readFileSync(
  path.resolve(import.meta.dirname, "../styles/globals.css"),
  "utf8"
);

const TINTED_TOKENS = [
  "background",
  "surface",
  "surface-secondary",
  "surface-tertiary",
  "default",
] as const;

function blockOf(source: string, selector: string): string {
  const start = source.indexOf(selector);

  expect(start, `${selector} block present`).toBeGreaterThan(-1);

  const open = source.indexOf("{", start);
  const close = source.indexOf("}", open);

  return source.slice(open + 1, close);
}

describe("dish tint CSS invariants", () => {
  const tintScope = blockOf(globalsCss, "[data-dish-tint]");

  it("captures every untinted token it rebuilds from, in both themes' selector lists", () => {
    const capture = blockOf(globalsCss, ':root,\n  .light,\n  [data-theme="light"],\n  .dark,');

    for (const token of TINTED_TOKENS) {
      expect(capture).toContain(`--untinted-${token}: var(--${token});`);
    }
  });

  it("rebuilds each tinted token from its own untinted lightness and the dish channels", () => {
    // The chroma may be the dish's in full or scaled down by a fixed factor
    // (ground at full strength, cards light, chips between); the hue is
    // always the dish's, the lightness always the untinted token's own.
    for (const token of TINTED_TOKENS) {
      const declaration = new RegExp(
        `--${token}:\\s*oklch\\(\\s*from var\\(--untinted-${token}\\)\\s*(l|calc\\(min\\(l,[^)]*\\)\\))\\s*(var\\(--dish-c[^)]*\\)|calc\\(var\\(--dish-c[^)]*\\)\\s*\\*\\s*[\\d.]+\\s*\\))\\s*var\\(--dish-h[^)]*\\)\\s*\\)`
      );

      expect(tintScope).toMatch(declaration);
    }
  });

  it("moves nothing but the page background and the card surfaces", () => {
    const overridden = [...tintScope.matchAll(/--([a-z-]+):/g)]
      .map((match) => match[1])
      .filter((name) => !name!.startsWith("untinted-") && !name!.startsWith("dish-"));

    expect(overridden.sort()).toEqual([...TINTED_TOKENS].sort());
  });

  it("introduces no lightness of the dish's own anywhere in the tint", () => {
    // The only lightness sources in the scope are the untinted tokens' `l`
    // channel; a numeric lightness would mean the dish got a say.
    expect(tintScope).not.toMatch(/oklch\(\s*[\d.]+/);
  });
});
