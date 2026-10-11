# 15 — Reader can choose theme colours over the dish tint

**What to build:** a per-device preference letting a reader decline the ambient tint and read recipes on the plain theme background instead. It is a scalar device preference beside `amount-display` and `recipe-view-mode` — **recipe page colour: `dish` (default) or `theme`** — not a Hidden Item: nothing is being hidden, and the page is no slimmer for choosing theme colours.

Define it with `defineDevicePreference` in `apps/web/lib/`, wrap it with `createDevicePreferenceContext`, and wire the provider into `AppShell` so it covers the `(app)` layout and the offline bootstrap alike. Seed it server-side from its cookie the way the layout already seeds `initialHiddenItems`, because that is the whole point of this mechanism here: a reader who has opted out must render untinted on the very first frame, never tinted-then-corrected. The control is a row in `preferences-card.tsx`.

Set to `theme`, the recipe page container emits no Dish Colour variables at all — rendering identical to a recipe that has no Dish Colour, which ticket 11 already guarantees looks finished rather than unfinished. The preference is presentation-only: extraction and storage (ticket 10) are unaffected, so flipping back is instant and needs no recomputation.

The share page is signed-out and carries no cookie of its own, so a visitor sees the default tinted rendering — while a Norish reader opening a share link on their own device carries their preference with them, since the cookie is `path=/`.

**Blocked by:** 11

**Status:** done

- [x] A scalar device preference `dish | theme` defaults to `dish` and persists per device
- [x] The provider is wired into `AppShell` and seeded server-side from the cookie
- [x] A reader set to `theme` renders untinted on the first frame, with no flash of tint on a server-rendered load, an offline bootstrap, or a navigation answered from the service worker's HTML cache
- [x] Set to `theme`, no Dish Colour variables are emitted and the page matches a no-Dish-Colour recipe exactly
- [x] The preference applies on mobile, desktop and the share page, and changes nothing outside recipe pages
- [x] Dish Colour extraction and storage are unaffected by the preference
- [x] A control row appears in the user preferences card, worded as a choice between two options rather than as hiding something
- [x] New strings are added across every supported locale and `pnpm i18n:check` passes
