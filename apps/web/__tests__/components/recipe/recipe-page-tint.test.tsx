import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import "@testing-library/jest-dom";

import type { RecipePageColorMode } from "@/lib/recipe-page-color";
import RecipePageTint from "@/components/recipes/recipe-page-tint";
import { RecipePageColorProvider } from "@/context/recipe-page-color-context";

function renderTint(dishColor: string | null | undefined, colorMode?: RecipePageColorMode) {
  return render(
    <RecipePageColorProvider initialValue={colorMode}>
      <RecipePageTint dishColor={dishColor}>
        <span data-testid="content">the page</span>
      </RecipePageTint>
    </RecipePageColorProvider>
  );
}

beforeEach(() => {
  document.cookie = "norish_recipe_page_color=;path=/;max-age=0";
});

describe("RecipePageTint", () => {
  it("scopes the channel variables and paints the viewport underlay for a Dish Colour", () => {
    const { container, getByTestId } = renderTint("#c04020");
    const scope = container.querySelector("[data-dish-tint]") as HTMLElement;

    expect(scope).not.toBeNull();
    expect(scope.style.getPropertyValue("--dish-h")).not.toBe("");
    expect(scope.style.getPropertyValue("--dish-c")).not.toBe("");
    expect(container.querySelector(".bg-background.fixed")).not.toBeNull();
    expect(getByTestId("content")).toBeInTheDocument();
  });

  it("emits no attribute, no variables and no underlay without one", () => {
    const { container, getByTestId } = renderTint(null);

    expect(container.querySelector("[data-dish-tint]")).toBeNull();
    expect(container.querySelector(".bg-background.fixed")).toBeNull();
    expect(getByTestId("content")).toBeInTheDocument();
  });

  it("renders the absent, the undefined and the unparseable colour identically", () => {
    const noColor = renderTint(null).container.innerHTML;

    expect(renderTint(undefined).container.innerHTML).toBe(noColor);
    expect(renderTint("not-a-colour").container.innerHTML).toBe(noColor);
  });

  it("renders a theme-preference reader identically to a no-Dish-Colour recipe", () => {
    // The one untinted code path: declining the tint and having no colour
    // meet at the same dishTintStyle(null), so the two cannot drift apart.
    const noColor = renderTint(null, "dish").container.innerHTML;

    expect(renderTint("#c04020", "theme").container.innerHTML).toBe(noColor);
  });

  it("never paints a tinted first frame for a reader seeded to theme colours", () => {
    // Seeded server-side (or read from the cookie before first paint), the
    // preference is already `theme` on the very first render — there is no
    // tinted-then-corrected frame for the reader to see.
    const { container } = renderTint("#c04020", "theme");

    expect(container.querySelector("[data-dish-tint]")).toBeNull();
  });

  it("reads the cookie itself on an unseeded mount, as the offline bootstrap does", () => {
    document.cookie = "norish_recipe_page_color=theme;path=/";

    const { container } = renderTint("#c04020");

    expect(container.querySelector("[data-dish-tint]")).toBeNull();
  });

  it("stays out of layout — the wrapper is display: contents", () => {
    const { container } = renderTint("#c04020");

    expect((container.firstElementChild as HTMLElement).className).toContain("contents");
  });
});
