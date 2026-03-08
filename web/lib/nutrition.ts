export type NutritionBasis = "PER_100G" | "PER_100ML";

export type NutritionValues = {
  energyKcal: number;
  energyKj: number;
  fat: number;
  saturates: number;
  carbohydrates: number;
  sugars: number;
  protein: number;
  salt: number;
};

export type IngredientNutritionSource = {
  id: string;
  ingredientName: string;
  category?: string | null;
  dosageGrams: number;
  densityKgPerL?: number | null;
  brixPercent?: number | null;
  energyKcal?: number | null;
  energyKj?: number | null;
  fat?: number | null;
  saturates?: number | null;
  carbohydrates?: number | null;
  sugars?: number | null;
  protein?: number | null;
  salt?: number | null;
  nutritionBasis?: NutritionBasis | null;
};

export type FormulaNutritionInput = {
  formulationId: string;
  formulationName: string;
  totalBatchMassGrams: number;
  formulationDensityGPerML?: number | null;
  targetMassPerLiterG?: number | null;
  ingredients: IngredientNutritionSource[];
};

export type FormulaNutritionResult = {
  formulationId: string;
  formulationName: string;
  batchMassGrams: number;
  batchVolumeMl: number;
  totalsPerBatch: NutritionValues;
  per100ml: NutritionValues;
  ingredientsBreakdown: Array<{
    ingredientId: string;
    ingredientName: string;
    dosageGrams: number;
    contributionPer100ml: NutritionValues;
  }>;
  warnings: string[];
};

const ZERO: NutritionValues = {
  energyKcal: 0,
  energyKj: 0,
  fat: 0,
  saturates: 0,
  carbohydrates: 0,
  sugars: 0,
  protein: 0,
  salt: 0,
};

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function addNutrition(a: NutritionValues, b: NutritionValues): NutritionValues {
  return {
    energyKcal: a.energyKcal + b.energyKcal,
    energyKj: a.energyKj + b.energyKj,
    fat: a.fat + b.fat,
    saturates: a.saturates + b.saturates,
    carbohydrates: a.carbohydrates + b.carbohydrates,
    sugars: a.sugars + b.sugars,
    protein: a.protein + b.protein,
    salt: a.salt + b.salt,
  };
}

function scaleNutrition(
  values: NutritionValues,
  factor: number,
): NutritionValues {
  return {
    energyKcal: values.energyKcal * factor,
    energyKj: values.energyKj * factor,
    fat: values.fat * factor,
    saturates: values.saturates * factor,
    carbohydrates: values.carbohydrates * factor,
    sugars: values.sugars * factor,
    protein: values.protein * factor,
    salt: values.salt * factor,
  };
}

function hasExplicitNutrition(source: IngredientNutritionSource): boolean {
  return (
    source.energyKcal != null ||
    source.energyKj != null ||
    source.fat != null ||
    source.saturates != null ||
    source.carbohydrates != null ||
    source.sugars != null ||
    source.protein != null ||
    source.salt != null
  );
}

function toEstimatedNutritionPer100(source: IngredientNutritionSource): {
  values: NutritionValues;
  warnings: string[];
} {
  const name = source.ingredientName.trim().toLowerCase();
  const category = (source.category ?? "").trim().toLowerCase();
  const brix = source.brixPercent ?? 0;

  if (name === "water") {
    return { values: ZERO, warnings: [] };
  }

  if (
    category === "sweetener" ||
    name.includes("sugar") ||
    name.includes("syrup") ||
    name.includes("agave")
  ) {
    const carbs = Math.max(0, Math.min(100, brix || 100));
    const sugars = Math.min(carbs, carbs * 0.98);
    const kcal = carbs * 4;
    return {
      values: {
        energyKcal: kcal,
        energyKj: kcal * 4.184,
        fat: 0,
        saturates: 0,
        carbohydrates: carbs,
        sugars,
        protein: 0,
        salt: 0,
      },
      warnings: [
        `Estimated nutrition for ${source.ingredientName} from sweetener profile.`,
      ],
    };
  }

  if (name.includes("concentrate") || (category === "juice" && brix >= 35)) {
    const carbs = Math.max(0, Math.min(85, brix || 65));
    const sugars = Math.min(carbs, carbs * 0.9);
    const protein = 0.3;
    const fat = 0.1;
    const kcal = carbs * 4 + protein * 4 + fat * 9;
    return {
      values: {
        energyKcal: kcal,
        energyKj: kcal * 4.184,
        fat,
        saturates: 0.02,
        carbohydrates: carbs,
        sugars,
        protein,
        salt: 0.01,
      },
      warnings: [
        `Estimated nutrition for ${source.ingredientName} from concentrate Brix.`,
      ],
    };
  }

  if (name.includes("puree") || name.includes("purée")) {
    const carbs = Math.max(0, Math.min(35, (brix || 20) * 0.85));
    const sugars = Math.min(carbs, carbs * 0.8);
    const protein = 0.4;
    const fat = 0.2;
    const kcal = carbs * 4 + protein * 4 + fat * 9;
    return {
      values: {
        energyKcal: kcal,
        energyKj: kcal * 4.184,
        fat,
        saturates: 0.03,
        carbohydrates: carbs,
        sugars,
        protein,
        salt: 0.01,
      },
      warnings: [
        `Estimated nutrition for ${source.ingredientName} from puree profile.`,
      ],
    };
  }

  return {
    values: ZERO,
    warnings: [
      `No nutrition profile for ${source.ingredientName}; assumed zero contribution.`,
    ],
  };
}

function resolvePer100(source: IngredientNutritionSource): {
  per100: NutritionValues;
  basis: NutritionBasis;
  warnings: string[];
} {
  const explicit = hasExplicitNutrition(source);

  if (!explicit) {
    const estimated = toEstimatedNutritionPer100(source);
    return {
      per100: estimated.values,
      basis: "PER_100G",
      warnings: estimated.warnings,
    };
  }

  const kcal = source.energyKcal ?? 0;
  const kj = source.energyKj ?? kcal * 4.184;

  return {
    per100: {
      energyKcal: kcal,
      energyKj: kj,
      fat: source.fat ?? 0,
      saturates: source.saturates ?? 0,
      carbohydrates: source.carbohydrates ?? 0,
      sugars: source.sugars ?? 0,
      protein: source.protein ?? 0,
      salt: source.salt ?? 0,
    },
    basis: source.nutritionBasis ?? "PER_100G",
    warnings: [],
  };
}

function toBatchVolumeMl(input: {
  totalBatchMassGrams: number;
  formulationDensityGPerML?: number | null;
  targetMassPerLiterG?: number | null;
}): { volumeMl: number; warning?: string } {
  if (
    input.formulationDensityGPerML != null &&
    Number.isFinite(input.formulationDensityGPerML) &&
    input.formulationDensityGPerML > 0
  ) {
    return {
      volumeMl: input.totalBatchMassGrams / input.formulationDensityGPerML,
    };
  }

  if (
    input.targetMassPerLiterG != null &&
    Number.isFinite(input.targetMassPerLiterG) &&
    input.targetMassPerLiterG > 0
  ) {
    return {
      volumeMl: (input.totalBatchMassGrams / input.targetMassPerLiterG) * 1000,
    };
  }

  return {
    volumeMl: input.totalBatchMassGrams,
    warning:
      "Batch density is missing. Per-100ml values were estimated with 1 g/mL.",
  };
}

export function calculateFormulaNutrition(
  input: FormulaNutritionInput,
): FormulaNutritionResult {
  const warnings: string[] = [];

  const batchVolume = toBatchVolumeMl({
    totalBatchMassGrams: input.totalBatchMassGrams,
    formulationDensityGPerML: input.formulationDensityGPerML,
    targetMassPerLiterG: input.targetMassPerLiterG,
  });

  if (batchVolume.warning) {
    warnings.push(batchVolume.warning);
  }

  const breakdown = input.ingredients.map((ingredient) => {
    const resolved = resolvePer100(ingredient);
    warnings.push(...resolved.warnings);

    const densityGPerMl =
      ingredient.densityKgPerL != null &&
      Number.isFinite(ingredient.densityKgPerL) &&
      ingredient.densityKgPerL > 0
        ? ingredient.densityKgPerL
        : 1;

    const dosageFactor =
      resolved.basis === "PER_100ML"
        ? ingredient.dosageGrams / densityGPerMl / 100
        : ingredient.dosageGrams / 100;

    if (resolved.basis === "PER_100ML" && densityGPerMl === 1) {
      warnings.push(
        `Missing density for ${ingredient.ingredientName}; used 1 g/mL for PER_100ML conversion.`,
      );
    }

    const contributionPerBatch = scaleNutrition(resolved.per100, dosageFactor);
    const per100mlFactor =
      batchVolume.volumeMl > 0 ? 100 / batchVolume.volumeMl : 0;

    return {
      ingredientId: ingredient.id,
      ingredientName: ingredient.ingredientName,
      dosageGrams: ingredient.dosageGrams,
      contributionPerBatch,
      contributionPer100ml: scaleNutrition(
        contributionPerBatch,
        per100mlFactor,
      ),
    };
  });

  const totalsPerBatch = breakdown.reduce(
    (sum, row) => addNutrition(sum, row.contributionPerBatch),
    ZERO,
  );

  const totalsPer100ml = breakdown.reduce(
    (sum, row) => addNutrition(sum, row.contributionPer100ml),
    ZERO,
  );

  const uniqueWarnings = [...new Set(warnings)];

  return {
    formulationId: input.formulationId,
    formulationName: input.formulationName,
    batchMassGrams: round2(input.totalBatchMassGrams),
    batchVolumeMl: round2(batchVolume.volumeMl),
    totalsPerBatch: {
      energyKcal: round2(totalsPerBatch.energyKcal),
      energyKj: round2(totalsPerBatch.energyKj),
      fat: round2(totalsPerBatch.fat),
      saturates: round2(totalsPerBatch.saturates),
      carbohydrates: round2(totalsPerBatch.carbohydrates),
      sugars: round2(totalsPerBatch.sugars),
      protein: round2(totalsPerBatch.protein),
      salt: round2(totalsPerBatch.salt),
    },
    per100ml: {
      energyKcal: round2(totalsPer100ml.energyKcal),
      energyKj: round2(totalsPer100ml.energyKj),
      fat: round2(totalsPer100ml.fat),
      saturates: round2(totalsPer100ml.saturates),
      carbohydrates: round2(totalsPer100ml.carbohydrates),
      sugars: round2(totalsPer100ml.sugars),
      protein: round2(totalsPer100ml.protein),
      salt: round2(totalsPer100ml.salt),
    },
    ingredientsBreakdown: breakdown
      .map((row) => ({
        ingredientId: row.ingredientId,
        ingredientName: row.ingredientName,
        dosageGrams: round2(row.dosageGrams),
        contributionPer100ml: {
          energyKcal: round2(row.contributionPer100ml.energyKcal),
          energyKj: round2(row.contributionPer100ml.energyKj),
          fat: round2(row.contributionPer100ml.fat),
          saturates: round2(row.contributionPer100ml.saturates),
          carbohydrates: round2(row.contributionPer100ml.carbohydrates),
          sugars: round2(row.contributionPer100ml.sugars),
          protein: round2(row.contributionPer100ml.protein),
          salt: round2(row.contributionPer100ml.salt),
        },
      }))
      .sort(
        (a, b) =>
          b.contributionPer100ml.energyKcal - a.contributionPer100ml.energyKcal,
      ),
    warnings: uniqueWarnings,
  };
}
