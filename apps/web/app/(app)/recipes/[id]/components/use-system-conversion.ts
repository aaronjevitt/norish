"use client";

import { useMemo } from "react";
import { usePermissionsContext } from "@/context/permissions-context";
import { useHiddenItemVisibility } from "@/hooks/user/use-hidden-item-visibility";
import { useTranslations } from "next-intl";

import type { MeasurementSystem } from "@norish/shared/contracts";

import { useRecipeContextRequired } from "../context";

export type SystemConversionOption = {
  key: MeasurementSystem;
  label: string;
  /** Nothing stored in this system: converting means asking the AI for it. */
  requiresAI: boolean;
};

export type SystemConversion = {
  /** Whether there is a conversion worth offering this reader at all. */
  isAvailable: boolean;
  options: SystemConversionOption[];
  currentSystem: MeasurementSystem;
  isConverting: boolean;
  convertTo: (target: MeasurementSystem) => void;
};

/**
 * The measurement conversion a recipe can offer, in one place: which systems
 * are reachable, which of them need an AI run, and whether this reader is
 * offered any of it. Converting is a permission-gated action on the recipe
 * and a Hidden Item, so the gate has to answer the same way wherever the
 * action is drawn — the mobile actions menu and the desktop control read it
 * from here rather than each deciding for themselves.
 */
export function useSystemConversion(): SystemConversion {
  const { recipe, convertingTo, startConversion } = useRecipeContextRequired();
  const { showConversion } = useHiddenItemVisibility();
  const { isAIEnabled } = usePermissionsContext();
  const t = useTranslations("recipes.convert");

  const availableSystems = useMemo(
    () => Array.from(new Set(recipe.recipeIngredients.map((ri) => ri.systemUsed))),
    [recipe.recipeIngredients]
  );

  const options = useMemo(() => {
    const built: SystemConversionOption[] = [];
    const metricRequiresAI = !availableSystems.includes("metric");
    const usRequiresAI = !availableSystems.includes("us");

    if (!metricRequiresAI || isAIEnabled) {
      built.push({ key: "metric", label: t("toMetric"), requiresAI: metricRequiresAI });
    }

    if (!usRequiresAI || isAIEnabled) {
      built.push({ key: "us", label: t("toUS"), requiresAI: usRequiresAI });
    }

    return built;
  }, [availableSystems, isAIEnabled, t]);

  const currentSystem: MeasurementSystem = convertingTo != null ? convertingTo : recipe.systemUsed;

  return {
    // One option is the system the recipe is already in: there is nothing to
    // convert to, so the control has nothing to say.
    isAvailable: showConversion && options.length > 1,
    options,
    currentSystem,
    isConverting: convertingTo != null,
    convertTo: (target: MeasurementSystem) => {
      if (target === currentSystem) return;

      startConversion(target);
    },
  };
}
