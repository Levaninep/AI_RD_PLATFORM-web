import { prisma } from "@/lib/prisma";
import {
  getEffectiveDevIngredientSpec,
  isDatabaseUnavailable,
} from "@/lib/dev-data-store";
import { env } from "@/lib/env";

export type EffectiveScopeInput = {
  formulationId?: string | null;
  projectId?: string | null;
};

export type EffectiveIngredientSpec = {
  ingredientId: string;
  ingredientName: string;
  effectivePricePerKgEur: number | null;
  effectiveDensityKgPerL: number | null;
  effectiveBrixPercent: number | null;
  effectiveSingleStrengthBrix: number | null;
  effectiveTitratableAcidityPercent: number | null;
  effectivePH: number | null;
  effectiveWaterContentPercent: number | null;
  sources: {
    pricePerKgEur: "database" | "overridden";
    densityKgPerL: "database" | "overridden";
    brixPercent: "database" | "overridden";
    singleStrengthBrix: "database" | "overridden";
    titratableAcidityPercent: "database" | "overridden";
    pH: "database" | "overridden";
    waterContentPercent: "database" | "overridden";
  };
  overrideId: string | null;
};

function scopesInPriority(input: EffectiveScopeInput) {
  return [
    { scopeType: "formulation", scopeId: input.formulationId ?? null },
    { scopeType: "project", scopeId: input.projectId ?? null },
    { scopeType: "global", scopeId: null },
  ];
}

export async function getEffectiveIngredientSpec(
  ingredientId: string,
  scope: EffectiveScopeInput = {},
): Promise<EffectiveIngredientSpec | null> {
  try {
    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId },
      // Select only legacy-safe fields needed for effective override resolution.
      // This avoids runtime failures when newer optional DB columns are not yet migrated.
      select: {
        id: true,
        ingredientName: true,
        pricePerKgEur: true,
        densityKgPerL: true,
        brixPercent: true,
        singleStrengthBrix: true,
        titratableAcidityPercent: true,
        pH: true,
        waterContentPercent: true,
      },
    });

    if (!ingredient) {
      return null;
    }

    let override: {
      id: string;
      overridePricePerKgEur: number | null;
      overrideDensityKgPerL: number | null;
      overrideBrixPercent: number | null;
      overrideTitratableAcidityPercent: number | null;
      overridePH: number | null;
      overrideWaterContentPercent: number | null;
    } | null = null;

    for (const target of scopesInPriority(scope)) {
      if (target.scopeType !== "global" && !target.scopeId) {
        continue;
      }

      const found = await prisma.ingredientOverride.findFirst({
        where: {
          ingredientId,
          scopeType: target.scopeType,
          scopeId: target.scopeId,
        },
        select: {
          id: true,
          overridePricePerKgEur: true,
          overrideDensityKgPerL: true,
          overrideBrixPercent: true,
          overrideTitratableAcidityPercent: true,
          overridePH: true,
          overrideWaterContentPercent: true,
        },
      });

      if (found) {
        override = found;
        break;
      }
    }

    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.ingredientName,
      effectivePricePerKgEur:
        override?.overridePricePerKgEur ?? ingredient.pricePerKgEur,
      effectiveDensityKgPerL:
        override?.overrideDensityKgPerL ?? ingredient.densityKgPerL,
      effectiveBrixPercent:
        override?.overrideBrixPercent ?? ingredient.brixPercent,
      effectiveSingleStrengthBrix: ingredient.singleStrengthBrix,
      effectiveTitratableAcidityPercent:
        override?.overrideTitratableAcidityPercent ??
        ingredient.titratableAcidityPercent,
      effectivePH: override?.overridePH ?? ingredient.pH,
      effectiveWaterContentPercent:
        override?.overrideWaterContentPercent ?? ingredient.waterContentPercent,
      sources: {
        pricePerKgEur:
          override?.overridePricePerKgEur != null ? "overridden" : "database",
        densityKgPerL:
          override?.overrideDensityKgPerL != null ? "overridden" : "database",
        brixPercent:
          override?.overrideBrixPercent != null ? "overridden" : "database",
        singleStrengthBrix: "database",
        titratableAcidityPercent:
          override?.overrideTitratableAcidityPercent != null
            ? "overridden"
            : "database",
        pH: override?.overridePH != null ? "overridden" : "database",
        waterContentPercent:
          override?.overrideWaterContentPercent != null
            ? "overridden"
            : "database",
      },
      overrideId: override?.id ?? null,
    };
  } catch (error) {
    if (!isDatabaseUnavailable(error) || env.isProduction) {
      throw error;
    }

    const fallback = getEffectiveDevIngredientSpec({
      ingredientId,
      formulationId: scope.formulationId,
      projectId: scope.projectId,
    });

    if (!fallback) {
      return null;
    }

    return {
      ingredientId: fallback.ingredient.id,
      ingredientName: fallback.ingredient.ingredientName,
      effectivePricePerKgEur: fallback.effectivePricePerKgEur,
      effectiveDensityKgPerL: fallback.effectiveDensityKgPerL,
      effectiveBrixPercent: fallback.effectiveBrixPercent,
      effectiveSingleStrengthBrix: fallback.effectiveSingleStrengthBrix,
      effectiveTitratableAcidityPercent:
        fallback.effectiveTitratableAcidityPercent,
      effectivePH: fallback.effectivePH,
      effectiveWaterContentPercent: fallback.effectiveWaterContentPercent,
      sources: {
        pricePerKgEur:
          fallback.sources.pricePerKgEur === "overridden"
            ? "overridden"
            : "database",
        densityKgPerL:
          fallback.sources.densityKgPerL === "overridden"
            ? "overridden"
            : "database",
        brixPercent:
          fallback.sources.brixPercent === "overridden"
            ? "overridden"
            : "database",
        singleStrengthBrix:
          fallback.sources.singleStrengthBrix === "overridden"
            ? "overridden"
            : "database",
        titratableAcidityPercent:
          fallback.sources.titratableAcidityPercent === "overridden"
            ? "overridden"
            : "database",
        pH: fallback.sources.pH === "overridden" ? "overridden" : "database",
        waterContentPercent:
          fallback.sources.waterContentPercent === "overridden"
            ? "overridden"
            : "database",
      },
      overrideId: fallback.override?.id ?? null,
    };
  }
}
