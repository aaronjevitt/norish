import type { CSSProperties } from "react";
import { asset } from "@/lib/assets";
import {
  ArrowsRightLeftIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  EllipsisHorizontalIcon,
  FireIcon as FireOutlineIcon,
  MinusIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { FireIcon } from "@heroicons/react/24/solid";

import { Shot } from "./shot";

/**
 * Amount, unit, name — the unit is the part Norish colours — and the
 * Ingredient Icon Norish ships for the food the line names, copied from
 * packages/shared-server/src/ingredients/icon-set.
 */
const ingredients = [
  {
    amount: "6",
    unit: "",
    name: "chicken thighs and/or drumsticks (bone-in, skin-on, about 2lbs)",
    icon: "chicken-thigh",
  },
  { amount: "3", unit: "tablespoons", name: "olive oil (divided)", icon: "olive-oil" },
  { amount: "1", unit: "", name: "green bell pepper (diced)", icon: "bell-pepper" },
  { amount: "1", unit: "", name: "red bell pepper (diced)", icon: "bell-pepper" },
  { amount: "1", unit: "medium", name: "yellow onion (thinly sliced)", icon: "onion" },
];

const tags = ["Meal prep", "Pasta", "chicken", "easy"];

/** A round control, as used by the servings stepper. */
function Control({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-default text-foreground/70 grid size-6 shrink-0 place-items-center rounded-full text-[11px]">
      {children}
    </span>
  );
}

/**
 * The top of a real Norish recipe page, rebuilt in markup: the photo, the
 * header card and the ingredients beneath it, cut off partway with a fade
 * because that is what it is — a slice of a longer page. Everything here
 * mirrors the running app, down to the bold amount, the green unit and the
 * plain ingredient name, and the recipe is the same Chicken Cacciatore the
 * tour captures open, cook and plan as tonight's dinner (see
 * assets/screenshots/README.md).
 */
export function RecipeFragment() {
  return (
    <div className="relative max-h-[36rem] overflow-hidden lg:max-h-[44rem]">
      <div className="space-y-3 lg:space-y-4">
        <div className="overflow-hidden rounded-2xl shadow-[0_30px_70px_-45px_rgb(0_0_0/0.5)]">
          <Shot
            alt="Chicken cacciatore in a rich tomato sauce over spaghetti"
            base="hero-dish"
            className="recipe-photo w-full"
            sizes="(min-width: 64rem) 36rem, (min-width: 48rem) 22rem, 92vw"
          />
        </div>

        <div className="border-border bg-surface rounded-2xl border p-4 shadow-[0_30px_70px_-45px_rgb(0_0_0/0.5)] lg:p-5">
          <div className="flex items-start gap-2">
            <h3 className="text-[15px] leading-snug font-semibold">
              <span aria-hidden className="mr-1.5">
                🇮🇹
              </span>
              Chicken Cacciatore
            </h3>
            <ArrowTopRightOnSquareIcon className="text-muted mt-0.5 size-3.5 shrink-0" />
            <span className="bg-default text-muted ml-auto grid size-6 shrink-0 place-items-center rounded-full">
              <EllipsisHorizontalIcon className="size-4" />
            </span>
          </div>

          <p className="text-muted mt-2 text-xs leading-relaxed">
            Tender pieces of chicken with fresh veggies are simmered in a rich tomato sauce and
            served over pasta.
          </p>

          <div className="text-muted mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <SunIcon className="size-3.5" />
              Lunch
            </span>
            <span className="flex items-center gap-1.5">
              <MoonIcon className="size-3.5" />
              Dinner
            </span>
          </div>

          <div className="text-muted mt-2 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <WrenchScrewdriverIcon className="size-3.5" />
              20m
            </span>
            <span className="flex items-center gap-1.5">
              <FireOutlineIcon className="size-3.5" />
              1:15h
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-3.5" />
              1:35h
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-default text-foreground/75 rounded-full px-2 py-0.5 text-[11px]"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="bg-accent text-accent-foreground mt-4 flex h-9 items-center justify-center gap-1.5 rounded-full text-sm font-medium">
            <FireIcon className="size-4" />
            Cook
          </p>
        </div>

        <div className="border-border bg-surface rounded-2xl border p-4 shadow-[0_30px_70px_-45px_rgb(0_0_0/0.5)] lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold">Ingredients</h4>
            <div className="flex items-center gap-1.5">
              <Control>½</Control>
              <Control>
                <MinusIcon className="size-3" />
              </Control>
              <span className="text-foreground/70 px-0.5 text-[11px]">4</span>
              <Control>
                <PlusIcon className="size-3" />
              </Control>
              <span className="bg-default text-foreground/70 flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px]">
                <ArrowsRightLeftIcon className="size-3" />
                US
              </span>
            </div>
          </div>

          <ul className="mt-3 space-y-2.5 lg:space-y-3">
            {ingredients.map(({ amount, unit, name, icon }, index) => (
              <li
                key={name}
                className="ingredient-row flex items-center gap-2.5 text-xs"
                style={{ "--row-delay": `${450 + index * 110}ms` } as CSSProperties}
              >
                <span className="bg-default size-4 shrink-0 rounded-full" />
                <img
                  alt=""
                  className="size-5 shrink-0 object-contain"
                  decoding="async"
                  height={20}
                  src={asset(`/ingredients/${icon}.webp`)}
                  width={20}
                />
                <span className="font-semibold">{amount}</span>
                {unit ? <span className="text-accent -ml-1.5 font-semibold">{unit}</span> : null}
                <span className="text-foreground/85 -ml-1.5 min-w-0">{name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div
        aria-hidden
        className="from-background pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t to-transparent"
      />
    </div>
  );
}
