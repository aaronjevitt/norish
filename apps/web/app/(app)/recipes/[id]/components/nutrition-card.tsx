"use client";

import { useState } from "react";
import { useRecipeContext } from "@/app/(app)/recipes/[id]/context";
import NutritionPortionControl from "@/components/recipes/nutrition-portion-control";
import { getNutritionData, NutritionBody } from "@/components/recipes/readonly-nutrition";
import { useHiddenItemVisibility } from "@/hooks/user/use-hidden-item-visibility";
import { Card, Skeleton } from "@heroui/react";
import { useTranslations } from "next-intl";

/**
 * Whether the Nutrition Information section has anything to show: something
 * stored, or a run in flight. Queued and processing both render as "working";
 * a quiet automatic failure simply leaves the panel showing whatever is
 * stored. A reader who has hidden Nutrition Information sees no section at
 * all, even mid-run — the four values leave together, and enrichment keeps
 * storing regardless.
 */
export function useNutritionSectionVisible(): boolean {
  const { recipe, enrichment } = useRecipeContext();
  const { showNutrition } = useHiddenItemVisibility();

  if (!recipe || !showNutrition) return false;

  return getNutritionData(recipe, 1).hasData || enrichment.isBusy("nutrition-estimation");
}

/**
 * Nutrition Information on the recipe page, following the Recipe Provenance
 * rules: the section is absent when nothing is stored and nothing is running,
 * a run in flight renders as working rather than naming its lifecycle state,
 * and both asking for a run and seeing that one failed live in the actions
 * menu — the card itself never reports enrichment state.
 *
 * The values themselves are the shared rendering, so the macro ring is one
 * picture kept honest in one place across mobile, desktop and the share page.
 */
export default function NutritionCard() {
  const { recipe, enrichment } = useRecipeContext();
  const isEstimatingNutrition = enrichment.isBusy("nutrition-estimation");
  const t = useTranslations("recipes.nutrition");
  const isVisible = useNutritionSectionVisible();
  // Independent portion state - defaults to 1 (per serving)
  const [portions, setPortions] = useState(1);

  if (!recipe || !isVisible) return null;

  const hasData = getNutritionData(recipe, 1).hasData;

  return (
    <Card className="rounded-2xl">
      <Card.Content className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          {hasData && !isEstimatingNutrition && (
            <NutritionPortionControl portions={portions} onChange={setPortions} />
          )}
        </div>
        {isEstimatingNutrition ? (
          <div className="flex items-center gap-5">
            <Skeleton className="size-32 shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16 rounded-md" />
                  <Skeleton className="h-4 w-12 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <NutritionBody portions={portions} recipe={recipe} />
            {portions !== 1 && (
              <p className="text-muted mt-2 text-center text-xs">
                {t("showingPortions", { count: portions })}
              </p>
            )}
          </>
        )}
      </Card.Content>
    </Card>
  );
}
