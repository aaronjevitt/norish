# Landing screenshots

These JPGs are the source captures behind the tour deck. The page never reads
them directly; `pnpm --filter @norish/landing shots` renders them into
`public/screenshots/optimized` at the exact sizes `components/shot.tsx`
requests. After replacing any capture here, run that script and commit both.

`hero-dish-{light,dark}.jpg` is the odd one out: a photograph rather than a
capture, the dish in the hero's recipe fragment. It is the recipe's own photo
as the app stores it (480 wide), cut to the fragment's band clear of the
site's watermark, and the dark variant is the same frame at 0.87 brightness so
it does not glare over the dark ground. Because 480 is all there is, the 2x
variant the optimizer writes is an upscale it sharpens rather than detail.

## The capture spec

Six screens (dashboard, recipe, cooking, calendar, groceries, pantry), and
every screen ships four captures, named `<screen>-<web|mobile>-<light|dark>.jpg`:

- **web**: 1800x1350 (a 900x675 viewport at 2x); the recipe page alone is
  2400x1800 (a 1200x900 viewport at 2x) — the same 4:3, but physically wider
  so the page shows itself with room to breathe
- **mobile**: 780x1546 (a 390x773 viewport at 2x), with the dashboard's
  recipe library in list view

The optimizer centre-crops anything with a different aspect and warns, because
a mismatched size almost always means the capture came from a different
session than the rest of the set.

`scripts/capture-shots.mjs` takes all twenty-four in one run against a
signed-in account (see the header of that file for usage). Cooking mode is
captured on `NORISH_COOK_STEP`, a step whose ingredient chips fit under the
instruction; the phone pass sends an iPhone user agent, because Norish keeps
preferences per device kind and the list view is the phone's.

## One instance, one story

All twenty-four captures come from one session (2026-10-12, a copy of the
production library on 0.25), so the deck reads as one household using one
app: Mike's own recipe library, seen from a household made for the shoot.

- today (Monday, October 12) holds two meals: Roasted Veggie Pitas with
  Avocado Dip for lunch, Chicken Cacciatore for dinner
- the recipe page and cooking mode are that same Chicken Cacciatore,
  tonight's dinner, captured on step 8 with its ingredient chips (bay leaf,
  capers, parmesan) under the instruction
- the hero fragment and its dish photo are that same recipe again
- the grocery list is the Cacciatore's, under one Albert Heijn store sorted
  by aisle, with the weekly milk due today and the bread already ticked away
- the Pantry holds what the household keeps in, which is why the olive oil,
  garlic, bay leaf, oregano and pepper flakes stayed off the grocery list
- the rest of the week is planned: Thai chicken salad and a salmon traybake
  on Tuesday, then dhal, boerenkool stamppot, orzo, pizza and beef
  bourguignon through Sunday

When retaking, keep it to one signed-in account on one day, keep every visible
recipe photographed, and keep a week planned that tells the same connected
story: the dish you open is the dish you cook, plan and shop for.
