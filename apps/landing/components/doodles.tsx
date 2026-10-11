import type { CSSProperties } from "react";

type DoodleProps = {
  className?: string;
};

/** Two user units, on a 240-wide drawing shown at around a fifth of that. */
const hairline = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/**
 * Every stroke is dashed to exactly its own length, so one rule can draw a
 * short tick and a long curve at the same rate (see `.doodle-line`).
 */
const drawn = { className: "doodle-line", pathLength: 1 } as const;

/** Where a stroke comes in the drawing; the later ones start a little after. */
const order = (step: number) => ({ "--doodle-step": step }) as CSSProperties;

/*
 * A drawing for each of the three moments, big enough to carry a section on
 * its own. They are scenes rather than icons: a thing happening, with room in
 * the drawing for the eye to follow it. Each draws itself in the order you
 * would draw it by hand as its step arrives, and then the parts of it that are
 * still happening keep happening — what the scroll does to a scene is the
 * point of it. Nothing here is a picture of the app — the tour further down
 * does that — so no part of one should look like something to press.
 */

const SCENE = "0 0 240 180";

/**
 * A rounded rectangle written out as a path. Basic shapes accept `pathLength`
 * unevenly across browsers and every stroke here relies on it, so the scenes
 * are drawn entirely out of paths.
 */
function box(x: number, y: number, w: number, h: number, r: number) {
  const across = w - r * 2;
  const down = h - r * 2;

  return `M${x + r} ${y}h${across}a${r} ${r} 0 0 1 ${r} ${r}v${down}a${r} ${r} 0 0 1 ${-r} ${r}h${-across}a${r} ${r} 0 0 1 ${-r} ${-r}v${-down}a${r} ${r} 0 0 1 ${r} ${-r}Z`;
}

/** How far a source has to travel, and how far in, to be gone into the bowl. */
const falling = (step: number, x: number, y: number) =>
  ({ "--fall-step": step, "--drop-x": `${x}px`, "--drop-y": `${y}px` }) as CSSProperties;

/**
 * Three sources going into a bowl. They draw themselves in as the step
 * arrives, and then the scroll itself carries them down and in: the whole
 * point of the step is that what you give it ends up in one place, so it
 * happens rather than being described. Scroll back up and they come out again.
 */
export function ImportScene({ className }: DoodleProps) {
  return (
    <svg aria-hidden className={className} viewBox={SCENE} xmlns="http://www.w3.org/2000/svg">
      <g {...hairline}>
        {/* The bowl, drawn first, the way you would start with what catches. */}
        <path {...drawn} d="M50 122h140" />
        <path {...drawn} d="M57 122c3 24 25 40 63 40s60-16 63-40" style={order(1)} />

        {/* What is in it once the three of them have landed. */}
        <path className="doodle-lands" d="M70 134c12 9 30 14 50 14s38-5 50-14" pathLength={1} />

        {/* A page, a video and a photo, tipped as though mid-fall — because in
            a moment that is what they are. */}
        <g className="doodle-drop" style={falling(0, 34, 92)}>
          <g transform="translate(36 40) rotate(-15)">
            <path {...drawn} d={box(0, 0, 48, 38, 8)} style={order(2)} />
            <path {...drawn} d="M0 13h48" style={order(3)} />
            <path {...drawn} d="M10 23h20M10 30h28" style={order(4)} />
          </g>
        </g>

        <g className="doodle-drop" style={falling(1, 0, 116)}>
          <g transform="translate(96 16) rotate(-2)">
            <path {...drawn} d={box(0, 0, 48, 38, 8)} style={order(3)} />
            <path {...drawn} d="M19 12.5 32 19l-13 6.5Z" style={order(4)} />
          </g>
        </g>

        <g className="doodle-drop" style={falling(2, -34, 94)}>
          <g transform="translate(158 38) rotate(14)">
            <path {...drawn} d={box(0, 0, 48, 38, 8)} style={order(4)} />
            <path {...drawn} d="M7 31l11-13 8 8 6-5 11 10" style={order(5)} />
            <circle className="doodle-dot" cx="34" cy="12" fill="currentColor" r="3" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/** A week on the wall with the meals going onto it. */
export function PlanScene({ className }: DoodleProps) {
  return (
    <svg aria-hidden className={className} viewBox={SCENE} xmlns="http://www.w3.org/2000/svg">
      <g {...hairline}>
        <path {...drawn} d={box(24, 46, 192, 112, 12)} />
        <path {...drawn} d="M24 76h192" style={order(1)} />
        <path {...drawn} d="M64 32v20M176 32v20" style={order(2)} />
        <path {...drawn} d="M72 76v82M120 76v82M168 76v82" style={order(3)} />

        {/* Meals already on the week. */}
        <path {...drawn} d={box(34, 88, 30, 12, 6)} style={order(4)} />
        <path {...drawn} d={box(81, 110, 30, 12, 6)} style={order(4)} />
        <path {...drawn} d={box(129, 88, 30, 12, 6)} style={order(5)} />

        {/* And one still on its way down onto the last day of the week. */}
        <path className="doodle-trace" d="M198 4c7 30-1 62-6 96" pathLength={1} style={order(5)} />
        <path {...drawn} d={box(177, 110, 30, 12, 6)} style={order(6)} />
      </g>
    </svg>
  );
}

/** A pan on the heat, mid-cook. */
export function CookScene({ className }: DoodleProps) {
  return (
    <svg aria-hidden className={className} viewBox={SCENE} xmlns="http://www.w3.org/2000/svg">
      <g {...hairline}>
        {/* Shallow and flat on the bottom, or it reads as a bowl. */}
        <path {...drawn} d="M16 112h154" />
        <path {...drawn} d="M23 112c2 20 17 32 38 32h52c21 0 36-12 38-32" style={order(1)} />
        <path {...drawn} d="M170 110 222 92" style={order(2)} />

        {/* On the heat, which is why any of it is steaming. */}
        <path {...drawn} d="M62 172c7-7 7-13 0-20M136 172c7-7 7-13 0-20" style={order(3)} />
        <path {...drawn} d="M99 174c7-7 7-13 0-20" style={order(4)} />

        {/* Steam is the one part that is not drawn and not scrubbed: it rises
            on its own clock for as long as the page is open, the three strands
            a third of a cycle apart, and only fades up with the last of the
            drawing. The order they sit in here is the order they rise in (see
            `.steam-line` and `.doodle-steam` in globals.css). */}
        <g className="doodle-steam">
          <path className="steam-line" d="M60 98c-11-12 10-21 0-33-9-11 6-20 0-31" />
          <path className="steam-line" d="M96 98c-11-12 10-21 0-33-8-10 5-18 0-29" />
          <path className="steam-line" d="M132 98c-11-12 10-21 0-33-9-11 6-20 0-31" />
        </g>
      </g>
    </svg>
  );
}
