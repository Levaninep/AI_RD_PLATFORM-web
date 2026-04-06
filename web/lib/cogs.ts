import {
  getEffectivePricePerKg,
  resolveBasePricePerKg,
} from "@/lib/formulation";
import { brixToDensityGPerML } from "@/lib/brix";

export type CogsSourceIngredient = {
  id: string;
  name?: string;
  ingredientName?: string;
  pricePerKgEur?: number | null;
  pricePerKg?: number | null;
};

export type CogsSourceFormulationItem = {
  dosageGrams: number;
  priceOverridePerKg?: number | null;
  ingredient: CogsSourceIngredient;
};

export type CogsSourceFormulation = {
  id: string;
  name: string;
  category: string;
  waterGramsPerLiter?: number | null;
  targetBrix?: number | null;
  correctedBrix?: number | null;
  densityGPerML?: number | null;
  ingredients: CogsSourceFormulationItem[];
};

export type CogsItemBreakdown = {
  ingredientName: string;
  dosageGrams: number;
  scaledDosageGrams: number;
  basePricePerKg: number | null;
  priceOverridePerKg: number | null;
  pricePerKg: number;
  costContributionUSD: number;
  costContributionPerLiterUSD: number;
};

export type CogsResult = {
  id: string;
  name: string;
  category: string;
  totalGrams: number;
  waterGrams: number;
  totalCostUSD: number;
  costPerKgUSD: number;
  costPerLiterUSD: number;
  costFor1LiterUSD: number;
  scaleTo1Liter: number;
  items: CogsItemBreakdown[];
};

function resolveDensity(formulation: CogsSourceFormulation): number {
  if (formulation.densityGPerML != null) {
    return formulation.densityGPerML;
  }
  const brix = formulation.correctedBrix ?? formulation.targetBrix;
  if (brix != null) {
    return brixToDensityGPerML(brix);
  }
  return 1.0;
}

function computeWaterGrams(
  formulation: CogsSourceFormulation,
  ingredientGrams: number,
): number {
  const density = resolveDensity(formulation);
  const totalMassPerLiter = density * 1000;
  return Math.max(0, totalMassPerLiter - ingredientGrams);
}

export function computeCogsForFormulation(
  formulation: CogsSourceFormulation,
): CogsResult {
  const ingredientGrams = formulation.ingredients.reduce(
    (sum, item) => sum + item.dosageGrams,
    0,
  );
  const waterGrams =
    formulation.waterGramsPerLiter ??
    computeWaterGrams(formulation, ingredientGrams);
  const totalGrams = ingredientGrams + waterGrams;

  const totalCostUSD = formulation.ingredients.reduce(
    (sum, item) =>
      sum +
      (item.dosageGrams / 1000) *
        getEffectivePricePerKg({
          basePricePerKg: resolveBasePricePerKg(item.ingredient),
          overridePricePerKg: item.priceOverridePerKg,
          useOverride: item.priceOverridePerKg != null,
        }),
    0,
  );

  const totalKg = totalGrams / 1000;
  const costPerKgUSD = totalKg > 0 ? totalCostUSD / totalKg : 0;
  const costPerLiterUSD = costPerKgUSD;
  const costFor1LiterUSD = costPerKgUSD * 1.0;
  const scaleTo1Liter = totalGrams > 0 ? 1000 / totalGrams : 0;

  const items = formulation.ingredients.map((item) => {
    const basePricePerKg = resolveBasePricePerKg(item.ingredient);
    const effectivePricePerKg = getEffectivePricePerKg({
      basePricePerKg,
      overridePricePerKg: item.priceOverridePerKg,
      useOverride: item.priceOverridePerKg != null,
    });

    const costContributionUSD = (item.dosageGrams / 1000) * effectivePricePerKg;
    const costContributionPerLiterUSD =
      totalGrams > 0 ? costContributionUSD * (1000 / totalGrams) : 0;

    return {
      ingredientName:
        item.ingredient.name ?? item.ingredient.ingredientName ?? "Unknown",
      dosageGrams: item.dosageGrams,
      scaledDosageGrams: item.dosageGrams * scaleTo1Liter,
      basePricePerKg,
      priceOverridePerKg: item.priceOverridePerKg ?? null,
      pricePerKg: effectivePricePerKg,
      costContributionUSD,
      costContributionPerLiterUSD,
    };
  });

  return {
    id: formulation.id,
    name: formulation.name,
    category: formulation.category,
    totalGrams,
    waterGrams,
    totalCostUSD,
    costPerKgUSD,
    costPerLiterUSD,
    costFor1LiterUSD,
    scaleTo1Liter,
    items,
  };
}
