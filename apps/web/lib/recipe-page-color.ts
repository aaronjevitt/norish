import { defineDevicePreference } from "@/lib/device-preferences";

/**
 * Whether recipe pages take their hue from the dish (ADR-0023) or stay on
 * the plain theme colours. A device preference like `amount-display` — not
 * a Hidden Item: nothing is hidden and the page is no slimmer for it. It is
 * presentation-only; the Dish Colour is extracted and stored either way, so
 * flipping back is instant. The cookie rides `path=/`, so a signed-in
 * reader's choice follows them onto the share route too.
 */
export const recipePageColorPreference = defineDevicePreference({
  cookieName: "norish_recipe_page_color",
  values: ["dish", "theme"] as const,
  defaultValue: "dish",
});

export type RecipePageColorMode = (typeof recipePageColorPreference.values)[number];
