import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import {
  isDatabaseUnavailable,
  listDevFormulations,
} from "@/lib/dev-data-store";
import { env } from "@/lib/env";
import { calculateFormulaNutrition } from "@/lib/nutrition";

function isMissingColumnError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  return message
    .toLowerCase()
    .includes("does not exist in the current database");
}

function isSuppressibleWarning(message: string): boolean {
  const normalized = message.trim().toLowerCase();

  if (normalized.startsWith("batch density is missing.")) {
    return true;
  }

  if (
    normalized.startsWith("estimated nutrition for") &&
    (normalized.includes("from concentrate brix") ||
      normalized.includes("from sweetener profile") ||
      normalized.includes("from puree profile"))
  ) {
    return true;
  }

  return false;
}

type NutritionSource = {
  id: string;
  name: string;
  densityGPerML?: number | null;
  targetMassPerLiterG?: number | null;
  waterGramsPerLiter?: number | null;
  ingredients: Array<{
    dosageGrams: number;
    ingredient: {
      id: string;
      ingredientName: string;
      category: string;
      densityKgPerL: number | null;
      brixPercent: number | null;
      energyKcal?: number | null;
      energyKj?: number | null;
      fat?: number | null;
      saturates?: number | null;
      carbohydrates?: number | null;
      sugars?: number | null;
      protein?: number | null;
      salt?: number | null;
      nutritionBasis?: "PER_100G" | "PER_100ML";
    };
  }>;
};

function buildNutritionResult(formulation: NutritionSource) {
  const ingredientMassGrams = formulation.ingredients.reduce(
    (sum, line) => sum + (line.dosageGrams ?? 0),
    0,
  );

  // Include water in the total batch mass so per-100ml is based on the full
  // 1 L product, not just the ingredient concentrate mass.
  // All formulations in this system are designed as 1L (1000 mL) batches.
  // When waterGramsPerLiter / density / targetMassPerLiterG are all absent,
  // fall back to 1000g total mass (≈ 1000 mL at 1 g/mL) so per-100-ml
  // values are realistic.
  const waterGrams =
    formulation.waterGramsPerLiter != null &&
    Number.isFinite(formulation.waterGramsPerLiter) &&
    formulation.waterGramsPerLiter > 0
      ? formulation.waterGramsPerLiter
      : 0;

  const hasDensityInfo =
    (formulation.densityGPerML != null && formulation.densityGPerML > 0) ||
    (formulation.targetMassPerLiterG != null &&
      formulation.targetMassPerLiterG > 0);

  const totalBatchMassGrams =
    hasDensityInfo || waterGrams > 0
      ? ingredientMassGrams + waterGrams
      : Math.max(ingredientMassGrams, 1000);

  const result = calculateFormulaNutrition({
    formulationId: formulation.id,
    formulationName: formulation.name,
    totalBatchMassGrams,
    formulationDensityGPerML: formulation.densityGPerML,
    targetMassPerLiterG: formulation.targetMassPerLiterG,
    ingredients: formulation.ingredients.map((line) => ({
      id: line.ingredient.id,
      ingredientName: line.ingredient.ingredientName,
      category: line.ingredient.category,
      dosageGrams: line.dosageGrams,
      densityKgPerL: line.ingredient.densityKgPerL,
      brixPercent: line.ingredient.brixPercent,
      energyKcal: line.ingredient.energyKcal,
      energyKj: line.ingredient.energyKj,
      fat: line.ingredient.fat,
      saturates: line.ingredient.saturates,
      carbohydrates: line.ingredient.carbohydrates,
      sugars: line.ingredient.sugars,
      protein: line.ingredient.protein,
      salt: line.ingredient.salt,
      nutritionBasis: line.ingredient.nutritionBasis,
    })),
  });

  return {
    ...result,
    warnings: result.warnings.filter(
      (warning) => !isSuppressibleWarning(warning),
    ),
  };
}

function buildDevNutritionResult(formulaId: string) {
  const devFormulation = listDevFormulations().find(
    (item) => item.id === formulaId,
  );

  if (!devFormulation) {
    return null;
  }

  return buildNutritionResult(devFormulation);
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = session?.user?.id?.trim() || null;
  const allowDevNoLogin =
    !env.isProduction && env.ALLOW_DEV_NO_LOGIN === "true";

  if (!userId && !allowDevNoLogin) {
    return NextResponse.json(
      { error: { message: "Unauthorized." } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const formulaId = searchParams.get("formulaId")?.trim() || "";

  if (!formulaId) {
    return NextResponse.json(
      { error: { message: "formulaId is required." } },
      { status: 400 },
    );
  }

  try {
    const where = {
      id: formulaId,
      ...(userId
        ? allowDevNoLogin
          ? { OR: [{ user: { is: { id: userId } } }, { userId: null }] }
          : { user: { is: { id: userId } } }
        : {}),
    };

    let formulation: NutritionSource | null = null;
    try {
      formulation = (await prisma.formulation.findFirst({
        where,
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      })) as NutritionSource | null;
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }

      formulation = (await prisma.formulation.findFirst({
        where,
        select: {
          id: true,
          name: true,
          ingredients: {
            select: {
              dosageGrams: true,
              ingredient: {
                select: {
                  id: true,
                  ingredientName: true,
                  category: true,
                  densityKgPerL: true,
                  brixPercent: true,
                },
              },
            },
          },
        },
      })) as NutritionSource | null;
    }

    if (formulation) {
      return NextResponse.json(buildNutritionResult(formulation));
    }

    if (!env.isProduction) {
      const devResult = buildDevNutritionResult(formulaId);
      if (devResult) {
        return NextResponse.json(devResult);
      }
    }

    return NextResponse.json(
      { error: { message: "Formulation not found." } },
      { status: 404 },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error) && !env.isProduction) {
      const devResult = buildDevNutritionResult(formulaId);
      if (devResult) {
        return NextResponse.json(devResult);
      }
    }

    return NextResponse.json(
      { error: { message: "Failed to calculate nutrition." } },
      { status: 500 },
    );
  }
}
