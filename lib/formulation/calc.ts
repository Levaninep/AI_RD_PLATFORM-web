import {
  getEffectivePricePerKg,
  resolveBasePricePerKg,
} from "@/lib/formulation";
import {
  type BatchSizeUnit,
  type DosageUnit,
  toMassKgFromMassUnit,
  toVolumeL,
} from "@/lib/units";

export type CalculationStatus = "complete" | "partial";

export type FormulationCalcIngredient = {
  id: string;
  ingredientName: string;
  category?: string | null;
  densityKgPerL: number | null;
  brixPercent: number | null;
  singleStrengthBrix?: number | null;
  titratableAcidityPercent: number | null;
  pricePerKgEur: number | null;
  co2SolubilityRelevant?: boolean;
};

export type FormulationCalcLineInput = {
  ingredient: FormulationCalcIngredient;
  dosageValue: number;
  dosageUnit: DosageUnit;
  priceOverridePerKgEur?: number | null;
};

export type FormulationCalcInput = {
  batchSizeValue: number;
  batchSizeUnit: BatchSizeUnit;
  lines: FormulationCalcLineInput[];
};

export type FormulationCalcBreakdownLine = {
  ingredientName: string;
  dosageValue: number;
  dosageUnit: DosageUnit;
  massKg: number | null;
  densityKgPerL: number | null;
  volumeL: number | null;
  brixPercent: number | null;
  singleStrengthBrix: number | null;
  solidsContributionKg: number | null;
  titratableAcidityPercent: number | null;
  acidContributionKg: number | null;
  juiceEquivalentKg: number | null;
  pricePerKgEur: number | null;
  lineCostEur: number | null;
  co2SolubilityRelevant: boolean;
  notes: string[];
};

export type FormulationCalcResult = {
  status: CalculationStatus;
  warnings: string[];
  finalMassKg: number;
  finalVolumeL: number | null;
  finalBrixPercent: number | null;
  finalTitratableAcidityPercent: number | null;
  finalTitratableAcidityGPerL: number | null;
  totalJuiceEquivalentKg: number;
  totalJuicePercent: number | null;
  totalCostEur: number;
  costPerLiterEur: number | null;
  costPerKgEur: number | null;
  breakdown: FormulationCalcBreakdownLine[];
  hooks: {
    co2RelevantMassKg: number;
    co2RelevantMassRatio: number;
  };
};

function round(value: number, digits = 6): number {
  return Number(value.toFixed(digits));
}

function roundCost(value: number): number {
  if (value > 0 && value < 0.01) {
    return round(value, 5);
  }

  return round(value, 4);
}

function isJuiceEquivalentEligible(
  ingredient: FormulationCalcIngredient,
): boolean {
  const category = (ingredient.category ?? "").trim().toLowerCase();
  if (category === "juice concentrate" || category === "puree") {
    return true;
  }

  if (category === "juice") {
    if (
      ingredient.singleStrengthBrix != null &&
      Number.isFinite(ingredient.singleStrengthBrix) &&
      ingredient.singleStrengthBrix > 0
    ) {
      return true;
    }
  }

  const name = ingredient.ingredientName.trim().toLowerCase();
  const looksLikeConcentrateOrPuree =
    name.includes("concentr") || name.includes("puree");

  return category === "juice" && looksLikeConcentrateOrPuree;
}

export function calculateFormulationMetrics(
  input: FormulationCalcInput,
): FormulationCalcResult {
  const warnings: string[] = [];
  const breakdown: FormulationCalcBreakdownLine[] = [];
  let status: CalculationStatus = "complete";

  if (!Number.isFinite(input.batchSizeValue) || input.batchSizeValue <= 0) {
    return {
      status: "partial",
      warnings: ["Batch size must be a positive number."],
      finalMassKg: 0,
      finalVolumeL: null,
      finalBrixPercent: null,
      finalTitratableAcidityPercent: null,
      finalTitratableAcidityGPerL: null,
      totalJuiceEquivalentKg: 0,
      totalJuicePercent: null,
      totalCostEur: 0,
      costPerLiterEur: null,
      costPerKgEur: null,
      breakdown: [],
      hooks: { co2RelevantMassKg: 0, co2RelevantMassRatio: 0 },
    };
  }

  let finalMassKg = input.batchSizeUnit === "kg" ? input.batchSizeValue : 0;
  let finalVolumeL = input.batchSizeUnit === "L" ? input.batchSizeValue : null;

  const massKnownLines: Array<{
    massKg: number;
    solidsKg: number;
    acidKg: number;
    juiceEquivalentKg: number;
    costEur: number;
    co2Relevant: boolean;
  }> = [];

  for (const line of input.lines) {
    const notes: string[] = [];
    let massKg: number | null = null;
    let volumeL: number | null = null;

    const fromMass = toMassKgFromMassUnit(line.dosageValue, line.dosageUnit);
    if (fromMass != null) {
      massKg = fromMass;
      if (line.ingredient.densityKgPerL && line.ingredient.densityKgPerL > 0) {
        volumeL = fromMass / line.ingredient.densityKgPerL;
      }
    }

    const fromVolume = toVolumeL(line.dosageValue, line.dosageUnit);
    if (fromVolume != null) {
      volumeL = fromVolume;
      if (line.ingredient.densityKgPerL && line.ingredient.densityKgPerL > 0) {
        massKg = fromVolume * line.ingredient.densityKgPerL;
      } else {
        notes.push("Density missing for volume-based dosage.");
        status = "partial";
        warnings.push(
          `${line.ingredient.ingredientName}: missing densityKgPerL for ${line.dosageUnit} conversion.`,
        );
      }
    }

    if (line.dosageUnit === "%w/w") {
      const fraction = line.dosageValue / 100;
      if (input.batchSizeUnit === "kg") {
        massKg = input.batchSizeValue * fraction;
      } else {
        notes.push(
          "%w/w with volume batch uses water-like approximation (1.0 kg/L).",
        );
        warnings.push(
          `${line.ingredient.ingredientName}: %w/w used with L batch, approximated at 1.0 kg/L.`,
        );
        status = "partial";
        massKg = input.batchSizeValue * 1.0 * fraction;
      }
    }

    const solidsKg =
      massKg != null && line.ingredient.brixPercent != null
        ? massKg * (line.ingredient.brixPercent / 100)
        : null;

    const acidKg =
      massKg != null && line.ingredient.titratableAcidityPercent != null
        ? massKg * (line.ingredient.titratableAcidityPercent / 100)
        : null;

    let juiceEquivalentKg: number | null = null;
    if (massKg != null && isJuiceEquivalentEligible(line.ingredient)) {
      const concentrateBrix = line.ingredient.brixPercent;
      const singleStrengthBrix = line.ingredient.singleStrengthBrix ?? null;

      if (
        concentrateBrix != null &&
        singleStrengthBrix != null &&
        singleStrengthBrix > 0
      ) {
        juiceEquivalentKg = massKg * (concentrateBrix / singleStrengthBrix);
      } else {
        notes.push("Single-strength juice Brix missing for juice equivalent.");
        warnings.push(
          `${line.ingredient.ingredientName}: missing singleStrengthBrix for juice equivalent calculation.`,
        );
        status = "partial";
      }
    }

    const effectivePricePerKg = getEffectivePricePerKg({
      basePricePerKg: resolveBasePricePerKg({
        ingredientName: line.ingredient.ingredientName,
        pricePerKgEur: line.ingredient.pricePerKgEur,
      }),
      overridePricePerKg: line.priceOverridePerKgEur,
      useOverride: line.priceOverridePerKgEur != null,
    });

    const lineCostEur = massKg != null ? massKg * effectivePricePerKg : null;

    breakdown.push({
      ingredientName: line.ingredient.ingredientName,
      dosageValue: line.dosageValue,
      dosageUnit: line.dosageUnit,
      massKg: massKg != null ? round(massKg) : null,
      densityKgPerL: line.ingredient.densityKgPerL,
      volumeL: volumeL != null ? round(volumeL) : null,
      brixPercent: line.ingredient.brixPercent,
      singleStrengthBrix: line.ingredient.singleStrengthBrix ?? null,
      solidsContributionKg: solidsKg != null ? round(solidsKg) : null,
      titratableAcidityPercent: line.ingredient.titratableAcidityPercent,
      acidContributionKg: acidKg != null ? round(acidKg) : null,
      juiceEquivalentKg:
        juiceEquivalentKg != null ? round(juiceEquivalentKg) : null,
      pricePerKgEur: effectivePricePerKg,
      lineCostEur: lineCostEur != null ? round(lineCostEur) : null,
      co2SolubilityRelevant: Boolean(line.ingredient.co2SolubilityRelevant),
      notes,
    });

    if (massKg != null) {
      massKnownLines.push({
        massKg,
        solidsKg: solidsKg ?? 0,
        acidKg: acidKg ?? 0,
        juiceEquivalentKg: juiceEquivalentKg ?? 0,
        costEur: lineCostEur ?? 0,
        co2Relevant: Boolean(line.ingredient.co2SolubilityRelevant),
      });
    }
  }

  const knownMassTotal = massKnownLines.reduce(
    (sum, line) => sum + line.massKg,
    0,
  );

  if (input.batchSizeUnit === "L") {
    finalMassKg = input.batchSizeValue * 1.0;
    warnings.push("Final mass estimated from volume batch using 1.0 kg/L.");
    status = "partial";
  }

  if (input.batchSizeUnit === "kg" && finalVolumeL == null) {
    if (knownMassTotal > 0) {
      finalVolumeL = knownMassTotal;
      warnings.push(
        "Final volume estimated from known line masses and 1.0 kg/L assumption.",
      );
      status = "partial";
    }
  }

  const totalSolidsKg = massKnownLines.reduce(
    (sum, line) => sum + line.solidsKg,
    0,
  );
  const totalAcidKg = massKnownLines.reduce(
    (sum, line) => sum + line.acidKg,
    0,
  );
  const totalJuiceEquivalentKg = massKnownLines.reduce(
    (sum, line) => sum + line.juiceEquivalentKg,
    0,
  );
  const totalCostEur = massKnownLines.reduce(
    (sum, line) => sum + line.costEur,
    0,
  );
  const co2RelevantMassKg = massKnownLines
    .filter((line) => line.co2Relevant)
    .reduce((sum, line) => sum + line.massKg, 0);

  const finalBrixPercent =
    finalMassKg > 0 ? (totalSolidsKg / finalMassKg) * 100 : null;
  const finalTitratableAcidityPercent =
    finalMassKg > 0 ? (totalAcidKg / finalMassKg) * 100 : null;
  const finalTitratableAcidityGPerL =
    finalVolumeL != null && finalVolumeL > 0
      ? (totalAcidKg * 1000) / finalVolumeL
      : null;
  const totalJuicePercent =
    finalMassKg > 0 ? (totalJuiceEquivalentKg / finalMassKg) * 100 : null;

  const costPerLiterEur =
    finalVolumeL != null && finalVolumeL > 0
      ? totalCostEur / finalVolumeL
      : null;
  const costPerKgEur = finalMassKg > 0 ? totalCostEur / finalMassKg : null;

  if (breakdown.some((line) => line.massKg == null)) {
    status = "partial";
  }

  return {
    status,
    warnings: [...new Set(warnings)],
    finalMassKg: round(finalMassKg),
    finalVolumeL: finalVolumeL == null ? null : round(finalVolumeL),
    finalBrixPercent:
      finalBrixPercent == null ? null : round(finalBrixPercent, 4),
    finalTitratableAcidityPercent:
      finalTitratableAcidityPercent == null
        ? null
        : round(finalTitratableAcidityPercent, 4),
    finalTitratableAcidityGPerL:
      finalTitratableAcidityGPerL == null
        ? null
        : round(finalTitratableAcidityGPerL, 4),
    totalJuiceEquivalentKg: round(totalJuiceEquivalentKg, 4),
    totalJuicePercent:
      totalJuicePercent == null ? null : round(totalJuicePercent, 1),
    totalCostEur: roundCost(totalCostEur),
    costPerLiterEur:
      costPerLiterEur == null ? null : roundCost(costPerLiterEur),
    costPerKgEur: costPerKgEur == null ? null : roundCost(costPerKgEur),
    breakdown,
    hooks: {
      co2RelevantMassKg: round(co2RelevantMassKg, 4),
      co2RelevantMassRatio:
        finalMassKg > 0 ? round(co2RelevantMassKg / finalMassKg, 6) : 0,
    },
  };
}
