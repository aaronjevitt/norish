"use client";

import { createDevicePreferenceContext } from "@/context/device-preference-context";
import { recipePageColorPreference } from "@/lib/recipe-page-color";

/**
 * Mounted in the app shell and in the share route's layout — the two
 * surfaces that render recipe pages — each seeding from its own server
 * pass; the offline bootstrap mounts the shell unseeded and the provider
 * reads the cookie itself. Seeding is the whole point here: a reader who
 * chose theme colours must render untinted on the very first frame, never
 * tinted-then-corrected.
 */
const { Provider: RecipePageColorProvider, usePreference: useRecipePageColor } =
  createDevicePreferenceContext(recipePageColorPreference, "RecipePageColor");

export { RecipePageColorProvider, useRecipePageColor };
