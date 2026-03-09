export type NutritionLineInput = {
  name?: string;
  massKg: number;
  energyKcal?: number | null;
  carbohydrates?: number | null;
  sugars?: number | null;
  protein?: number | null;
  fat?: number | null;
  salt?: number | null;
  nutritionBasis?: "PER_100G" | "PER_100ML" | null;
};

export type NutritionTotals = {
  energyKcal: number;
  carbohydrates: number;
  sugars: number;
  protein: number;
  fat: number;
  salt: number;
};

export type NutritionEstimateResult = {
  totalsPerBatch: NutritionTotals;
  per100g: NutritionTotals | null;
  batchMassKg: number;
  warnings: string[];
};

const ZERO: NutritionTotals = {
  energyKcal: 0,
  carbohydrates: 0,
  sugars: 0,
  protein: 0,
  fat: 0,
  salt: 0,
};

function round(value: number, digits = 3) {
  return Number(value.toFixed(digits));
}

function addTotals(
  left: NutritionTotals,
  right: NutritionTotals,
): NutritionTotals {
  return {
    energyKcal: left.energyKcal + right.energyKcal,
    carbohydrates: left.carbohydrates + right.carbohydrates,
    sugars: left.sugars + right.sugars,
    protein: left.protein + right.protein,
    fat: left.fat + right.fat,
    salt: left.salt + right.salt,
  };
}

export function estimateNutrition(
  lines: NutritionLineInput[],
): NutritionEstimateResult {
  const warnings: string[] = [];
  const batchMassKg = lines.reduce(
    (sum, line) => sum + Math.max(0, line.massKg),
    0,
  );

  const totalsPerBatch = lines.reduce((sum, line) => {
    const factor = Math.max(0, line.massKg) * 10;

    if (
      line.energyKcal == null &&
      line.carbohydrates == null &&
      line.sugars == null &&
      line.protein == null &&
      line.fat == null &&
      line.salt == null
    ) {
      warnings.push(
        `${line.name ?? "Unnamed ingredient"}: no nutrition data available.`,
      );
    }

    return addTotals(sum, {
      energyKcal: (line.energyKcal ?? 0) * factor,
      carbohydrates: (line.carbohydrates ?? 0) * factor,
      sugars: (line.sugars ?? 0) * factor,
      protein: (line.protein ?? 0) * factor,
      fat: (line.fat ?? 0) * factor,
      salt: (line.salt ?? 0) * factor,
    });
  }, ZERO);

  const per100g =
    batchMassKg > 0
      ? {
          energyKcal: round(totalsPerBatch.energyKcal / (batchMassKg * 10)),
          carbohydrates: round(
            totalsPerBatch.carbohydrates / (batchMassKg * 10),
          ),
          sugars: round(totalsPerBatch.sugars / (batchMassKg * 10)),
          protein: round(totalsPerBatch.protein / (batchMassKg * 10)),
          fat: round(totalsPerBatch.fat / (batchMassKg * 10)),
          salt: round(totalsPerBatch.salt / (batchMassKg * 10)),
        }
      : null;

  return {
    totalsPerBatch: {
      energyKcal: round(totalsPerBatch.energyKcal),
      carbohydrates: round(totalsPerBatch.carbohydrates),
      sugars: round(totalsPerBatch.sugars),
      protein: round(totalsPerBatch.protein),
      fat: round(totalsPerBatch.fat),
      salt: round(totalsPerBatch.salt),
    },
    per100g,
    batchMassKg: round(batchMassKg),
    warnings,
  };
}

// Future extension: support density-aware per-100ml outputs and label rounding rules.
