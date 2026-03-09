import {
  isDatabaseUnavailable,
  listDevFormulations,
  type DevFormulation,
} from "@/lib/dev-data-store";
import { env } from "@/lib/env";
import {
  calculateFormulationBatchCost,
  resolveBasePricePerKg,
} from "@/lib/formulation";
import { prisma } from "@/lib/prisma";

export type FormulaIngredientRecord = {
  id: string;
  ingredientId: string;
  dosageGrams: number;
  amount: number | null;
  unit: string | null;
  priceOverridePerKg: number | null;
  ingredient: {
    id: string;
    name: string;
    category: string;
    brix: number | null;
    acidity: number | null;
    density: number | null;
    pricePerKg: number | null;
    kcal: number | null;
    sugars: number | null;
    protein: number | null;
    fat: number | null;
    salt: number | null;
    carbohydrates: number | null;
    singleStrengthBrix: number | null;
  };
};

export type FormulaRecord = {
  id: string;
  name: string;
  category: string;
  targetBrix: number | null;
  targetPH: number | null;
  co2GPerL: number | null;
  desiredBrix: number | null;
  temperatureC: number | null;
  correctedBrix: number | null;
  densityGPerML: number | null;
  targetMassPerLiterG: number | null;
  waterGramsPerLiter: number | null;
  notes: string | null;
  updatedAt: Date;
  ingredients: FormulaIngredientRecord[];
};

export type FormulaComparisonResult = {
  left: {
    id: string;
    name: string;
    ingredientCount: number;
    targetBrix: number | null;
    targetPH: number | null;
    totalCost: number;
  };
  right: {
    id: string;
    name: string;
    ingredientCount: number;
    targetBrix: number | null;
    targetPH: number | null;
    totalCost: number;
  };
  overlapIngredients: string[];
  uniqueToLeft: string[];
  uniqueToRight: string[];
};

const formulationSelect = {
  id: true,
  name: true,
  category: true,
  targetBrix: true,
  targetPH: true,
  co2GPerL: true,
  desiredBrix: true,
  temperatureC: true,
  correctedBrix: true,
  densityGPerML: true,
  targetMassPerLiterG: true,
  waterGramsPerLiter: true,
  notes: true,
  updatedAt: true,
  ingredients: {
    select: {
      id: true,
      ingredientId: true,
      dosageGrams: true,
      amount: true,
      unit: true,
      priceOverridePerKg: true,
      ingredient: {
        select: {
          id: true,
          ingredientName: true,
          category: true,
          brixPercent: true,
          titratableAcidityPercent: true,
          densityKgPerL: true,
          pricePerKgEur: true,
          energyKcal: true,
          sugars: true,
          protein: true,
          fat: true,
          salt: true,
          carbohydrates: true,
          singleStrengthBrix: true,
        },
      },
    },
  },
} as const;

function mapDevFormula(record: DevFormulation): FormulaRecord {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    targetBrix: record.targetBrix,
    targetPH: record.targetPH,
    co2GPerL: record.co2GPerL,
    desiredBrix: record.desiredBrix,
    temperatureC: record.temperatureC,
    correctedBrix: record.correctedBrix,
    densityGPerML: record.densityGPerML,
    targetMassPerLiterG: record.targetMassPerLiterG,
    waterGramsPerLiter: record.waterGramsPerLiter,
    notes: record.notes,
    updatedAt: record.updatedAt,
    ingredients: record.ingredients.map((line) => ({
      id: line.id,
      ingredientId: line.ingredientId,
      dosageGrams: line.dosageGrams,
      amount: line.amount,
      unit: line.unit,
      priceOverridePerKg: line.priceOverridePerKg,
      ingredient: {
        id: line.ingredient.id,
        name: line.ingredient.ingredientName,
        category: line.ingredient.category,
        brix: line.ingredient.brixPercent,
        acidity: line.ingredient.titratableAcidityPercent,
        density: line.ingredient.densityKgPerL,
        pricePerKg: line.ingredient.pricePerKgEur,
        kcal: line.ingredient.energyKcal,
        sugars: line.ingredient.sugars,
        protein: line.ingredient.protein,
        fat: line.ingredient.fat,
        salt: line.ingredient.salt,
        carbohydrates: line.ingredient.carbohydrates,
        singleStrengthBrix: line.ingredient.singleStrengthBrix,
      },
    })),
  };
}

function mapDbFormula(record: {
  id: string;
  name: string;
  category: string;
  targetBrix: number | null;
  targetPH: number | null;
  co2GPerL: number | null;
  desiredBrix: number | null;
  temperatureC: number | null;
  correctedBrix: number | null;
  densityGPerML: number | null;
  targetMassPerLiterG: number | null;
  waterGramsPerLiter: number | null;
  notes: string | null;
  updatedAt: Date;
  ingredients: Array<{
    id: string;
    ingredientId: string;
    dosageGrams: number;
    amount: number | null;
    unit: string | null;
    priceOverridePerKg: number | null;
    ingredient: {
      id: string;
      ingredientName: string;
      category: string;
      brixPercent: number | null;
      titratableAcidityPercent: number | null;
      densityKgPerL: number | null;
      pricePerKgEur: number;
      energyKcal: number | null;
      sugars: number | null;
      protein: number | null;
      fat: number | null;
      salt: number | null;
      carbohydrates: number | null;
      singleStrengthBrix: number | null;
    };
  }>;
}): FormulaRecord {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
    targetBrix: record.targetBrix,
    targetPH: record.targetPH,
    co2GPerL: record.co2GPerL,
    desiredBrix: record.desiredBrix,
    temperatureC: record.temperatureC,
    correctedBrix: record.correctedBrix,
    densityGPerML: record.densityGPerML,
    targetMassPerLiterG: record.targetMassPerLiterG,
    waterGramsPerLiter: record.waterGramsPerLiter,
    notes: record.notes,
    updatedAt: record.updatedAt,
    ingredients: record.ingredients.map((line) => ({
      id: line.id,
      ingredientId: line.ingredientId,
      dosageGrams: line.dosageGrams,
      amount: line.amount,
      unit: line.unit,
      priceOverridePerKg: line.priceOverridePerKg,
      ingredient: {
        id: line.ingredient.id,
        name: line.ingredient.ingredientName,
        category: line.ingredient.category,
        brix: line.ingredient.brixPercent,
        acidity: line.ingredient.titratableAcidityPercent,
        density: line.ingredient.densityKgPerL,
        pricePerKg: line.ingredient.pricePerKgEur,
        kcal: line.ingredient.energyKcal,
        sugars: line.ingredient.sugars,
        protein: line.ingredient.protein,
        fat: line.ingredient.fat,
        salt: line.ingredient.salt,
        carbohydrates: line.ingredient.carbohydrates,
        singleStrengthBrix: line.ingredient.singleStrengthBrix,
      },
    })),
  };
}

async function withFallback<T>(
  query: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  try {
    return await query();
  } catch (error) {
    if (isDatabaseUnavailable(error) || !env.isProduction) {
      return fallback();
    }

    throw error;
  }
}

function scoreFormulaMatch(message: string, formula: FormulaRecord) {
  const normalizedMessage = message.toLowerCase();
  const normalizedName = formula.name.toLowerCase();

  if (normalizedMessage.includes(normalizedName)) {
    return normalizedName.length + 50;
  }

  return normalizedName
    .split(/\s+/)
    .filter((token) => token.length > 2 && normalizedMessage.includes(token))
    .length;
}

function estimateFormulaCostValue(formula: FormulaRecord): number {
  return calculateFormulationBatchCost(
    formula.ingredients.map((line) => ({
      dosageGrams: line.dosageGrams,
      priceOverridePerKg: line.priceOverridePerKg,
      ingredient: {
        ingredientName: line.ingredient.name,
        pricePerKgEur:
          line.ingredient.pricePerKg ??
          resolveBasePricePerKg({ ingredientName: line.ingredient.name }),
      },
    })),
  ).totalCostUSD;
}

export async function listFormulas(limit = 50): Promise<FormulaRecord[]> {
  return withFallback(
    async () => {
      const rows = await prisma.formulation.findMany({
        select: formulationSelect,
        take: limit,
        orderBy: { updatedAt: "desc" },
      });

      return rows.map(mapDbFormula);
    },
    () => listDevFormulations().map(mapDevFormula).slice(0, limit),
  );
}

export async function getFormulaById(
  id: string,
): Promise<FormulaRecord | null> {
  return withFallback(
    async () => {
      const row = await prisma.formulation.findUnique({
        where: { id },
        select: formulationSelect,
      });

      return row ? mapDbFormula(row) : null;
    },
    () => {
      const row = listDevFormulations().find((item) => item.id === id);
      return row ? mapDevFormula(row) : null;
    },
  );
}

export async function getFormulaByName(
  name: string,
): Promise<FormulaRecord | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const formulas = await listFormulas(100);
  return (
    formulas.find((item) => item.name.trim().toLowerCase() === normalized) ??
    null
  );
}

export async function listFormulaIngredients(
  formulaId: string,
): Promise<FormulaIngredientRecord[]> {
  const formula = await getFormulaById(formulaId);
  return formula?.ingredients ?? [];
}

export async function searchFormulasByMessage(
  message: string,
  limit = 3,
): Promise<FormulaRecord[]> {
  const formulas = await listFormulas(100);

  return formulas
    .map((item) => ({ item, score: scoreFormulaMatch(message, item) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

export async function compareFormulas(
  leftFormulaId: string,
  rightFormulaId: string,
): Promise<FormulaComparisonResult | null> {
  const [left, right] = await Promise.all([
    getFormulaById(leftFormulaId),
    getFormulaById(rightFormulaId),
  ]);

  if (!left || !right) {
    return null;
  }

  const leftNames = new Set(
    left.ingredients.map((line) => line.ingredient.name),
  );
  const rightNames = new Set(
    right.ingredients.map((line) => line.ingredient.name),
  );
  const overlapIngredients = [...leftNames].filter((name) =>
    rightNames.has(name),
  );

  return {
    left: {
      id: left.id,
      name: left.name,
      ingredientCount: left.ingredients.length,
      targetBrix: left.targetBrix,
      targetPH: left.targetPH,
      totalCost: estimateFormulaCostValue(left),
    },
    right: {
      id: right.id,
      name: right.name,
      ingredientCount: right.ingredients.length,
      targetBrix: right.targetBrix,
      targetPH: right.targetPH,
      totalCost: estimateFormulaCostValue(right),
    },
    overlapIngredients,
    uniqueToLeft: [...leftNames].filter((name) => !rightNames.has(name)),
    uniqueToRight: [...rightNames].filter((name) => !leftNames.has(name)),
  };
}

// Future extension: save AI-assisted formulation variants and project-scoped comparisons.
