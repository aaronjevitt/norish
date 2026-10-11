# 09 — Cooking mode bottom bar and Ready At

**What to build:** replace cooking mode's `▲ / "n of m" / ▼` row with a bar carrying the meter, **Ready At**, the step counter, and then back / timers / ingredients / keep-screen-on plus a primary Next Step. The back chevron is kept deliberately: without it, a touch user who never discovers the vertical swipe has no way back. Keep-screen-on reuses `wake-lock-toggle.tsx`.

**Ready At** is the Cooking Session's start plus the recipe's total time, computed when cooking mode opens and shown only there. It is a projection, never a promise — nothing observes whether the cook started, paused or walked away — so it must never be worded as a commitment, and a recipe with no total time has none. A **Cooking Session** is not persisted, not resumed and not shared: closing cooking mode ends it, and reopening starts a new one at the first step.

**Blocked by:** 08

**Status:** done

- [x] The bottom bar shows meter, Ready At and step counter above back / timers / ingredients / keep-screen-on and Next Step
- [x] The back chevron changes step and is disabled on the first step
- [x] Ready At is anchored to when cooking mode opened, not to page load
- [x] Closing and reopening cooking mode restarts at the first step with a fresh Ready At
- [x] A recipe with no total time shows no Ready At
- [x] Ready At appears nowhere on the recipe page, including the Cooking Time card
- [x] Copy reads as a projection, and new strings pass `pnpm i18n:check` across every locale
