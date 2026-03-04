import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client/client";
import { prisma } from "@/lib/prisma";
import {
  calculateFormulationBatchCost,
  validateCreateFormulationInput,
} from "@/lib/formulation";
import {
  applyBrixTemperatureCorrection,
  brixToDensityGPerML,
} from "@/lib/brix";
import {
  createDevFormulation,
  isDatabaseUnavailable,
  listDevFormulations,
} from "@/lib/dev-data-store";
import { getActivityActorFromRequest, logActivity } from "@/lib/activity";
import { env } from "@/lib/env";
import { getEffectiveIngredientSpec } from "@/lib/ingredient-effective";

type ResolvedFormulationItem = {
  ingredientId: string;
  amount: number;
  unit: "kg" | "g" | "L" | "mL" | "ml" | "%w/w";
  dosageGrams: number;
  priceOverridePerKg: number | null;
};

function toDosageGrams(input: {
  amount: number;
  unit: "kg" | "g" | "L" | "mL" | "ml" | "%w/w";
  density: number | null;
}): number {
  const density =
    input.density != null && Number.isFinite(input.density) && input.density > 0
      ? input.density
      : 1;

  if (input.unit === "kg") {
    return input.amount * 1000;
  }

  if (input.unit === "g") {
    return input.amount;
  }

  if (input.unit === "L") {
    return input.amount * density * 1000;
  }

  if (input.unit === "mL" || input.unit === "ml") {
    return (input.amount / 1000) * density * 1000;
  }

  return input.amount;
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function withComputedCost<
  T extends {
    ingredients: Array<{
      dosageGrams: number;
      ingredient: { pricePerKgEur?: number | null; pricePerKg?: number | null };
    }>;
  },
>(
  formulation: T,
): T & {
  totalGrams: number;
  totalCostUSD: number;
  costPerKgUSD: number;
} {
  const cost = calculateFormulationBatchCost(formulation.ingredients);

  return {
    ...formulation,
    totalGrams: cost.totalGrams,
    totalCostUSD: cost.totalCostUSD,
    costPerKgUSD: cost.costPerKgUSD,
  };
}

function withIngredientNameAlias<
  T extends {
    ingredients: Array<{
      ingredient: {
        ingredientName?: string;
        name?: string;
      };
    }>;
  },
>(formulation: T): T {
  return {
    ...formulation,
    ingredients: formulation.ingredients.map((line) => ({
      ...line,
      ingredient: {
        ...line.ingredient,
        name: line.ingredient.name ?? line.ingredient.ingredientName ?? "",
      },
    })),
  };
}

export async function GET() {
  try {
    const formulations = await prisma.formulation.findMany({
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      formulations.map((item) =>
        withIngredientNameAlias(withComputedCost(item)),
      ),
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        listDevFormulations().map((item) =>
          withIngredientNameAlias(withComputedCost(item)),
        ),
      );
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to load formulations.",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const actor = getActivityActorFromRequest(req);

  try {
    const parsed = validateCreateFormulationInput(payload);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: { message: parsed.message } },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const existingIds = data.items
      .map((item) => item.ingredientId)
      .filter((id): id is string => Boolean(id));

    const existingIngredients =
      existingIds.length === 0
        ? []
        : await prisma.ingredient.findMany({
            where: { id: { in: existingIds } },
            select: { id: true },
          });

    if (existingIngredients.length !== new Set(existingIds).size) {
      return NextResponse.json(
        {
          error: {
            message: "One or more selected ingredients were not found.",
          },
        },
        { status: 400 },
      );
    }

    const ingredientById = new Map(
      existingIngredients.map((item) => [item.id, item] as const),
    );

    const effectiveByIngredientId = new Map<
      string,
      Awaited<ReturnType<typeof getEffectiveIngredientSpec>>
    >();

    for (const ingredientId of new Set(existingIds)) {
      const effective = await getEffectiveIngredientSpec(ingredientId, {});
      effectiveByIngredientId.set(ingredientId, effective);
    }

    for (const item of data.items) {
      const ingredient = ingredientById.get(item.ingredientId);
      if (!ingredient) {
        continue;
      }

      const effective = effectiveByIngredientId.get(item.ingredientId);
      const basePrice = effective?.effectivePricePerKgEur ?? null;
      const hasBasePrice =
        basePrice != null && Number.isFinite(basePrice) && basePrice > 0;
      const hasOverride =
        item.priceOverridePerKg != null &&
        Number.isFinite(item.priceOverridePerKg) &&
        item.priceOverridePerKg > 0;

      if (!hasBasePrice && !hasOverride) {
        return NextResponse.json(
          {
            error: {
              message:
                "Ingredient without base price requires a valid price override.",
            },
          },
          { status: 400 },
        );
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const resolvedItems: ResolvedFormulationItem[] = [];

      for (const item of data.items) {
        resolvedItems.push({
          ingredientId: item.ingredientId,
          amount: item.amount,
          unit: item.unit,
          dosageGrams: toDosageGrams({
            amount: item.amount,
            unit: item.unit,
            density:
              effectiveByIngredientId.get(item.ingredientId)
                ?.effectiveDensityKgPerL ?? null,
          }),
          priceOverridePerKg: item.priceOverridePerKg ?? null,
        });
      }

      const uniqueIngredientCount = new Set(
        resolvedItems.map((item) => item.ingredientId),
      ).size;

      if (uniqueIngredientCount !== resolvedItems.length) {
        throw new HttpError(
          409,
          "Each ingredient can only be added once per formulation.",
        );
      }

      const formulation = await tx.formulation.create({
        data: (() => {
          const totalIngredientMass = resolvedItems.reduce(
            (sum, item) => sum + item.dosageGrams,
            0,
          );

          const normalizedTemperatureC =
            data.desiredBrix === null ? null : (data.temperatureC ?? 20);

          const correctedBrix =
            data.desiredBrix === null || normalizedTemperatureC === null
              ? null
              : applyBrixTemperatureCorrection(
                  data.desiredBrix,
                  normalizedTemperatureC,
                );

          const densityGPerML =
            correctedBrix === null ? null : brixToDensityGPerML(correctedBrix);

          const targetMassPerLiterG =
            densityGPerML === null ? null : densityGPerML * 1000;

          const waterGramsPerLiter =
            targetMassPerLiterG === null
              ? null
              : Math.max(0, targetMassPerLiterG - totalIngredientMass);

          return {
            name: data.name,
            category: data.category,
            targetBrix: data.targetBrix,
            targetPH: data.targetPH,
            co2GPerL: data.co2GPerL,
            desiredBrix: data.desiredBrix,
            temperatureC: normalizedTemperatureC,
            correctedBrix,
            densityGPerML,
            targetMassPerLiterG,
            waterGramsPerLiter,
            notes: data.notes,
            ingredients: {
              create: resolvedItems.map((item) => ({
                ingredientId: item.ingredientId,
                amount: item.amount,
                unit: item.unit,
                dosageGrams: item.dosageGrams,
                priceOverridePerKg: item.priceOverridePerKg,
              })),
            },
          };
        })(),
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });

      return formulation;
    });

    await logActivity({
      shelfLifeTestId: null,
      entityType: "FORMULATION",
      entityId: created.id,
      action: "CREATE",
      actorId: actor.actorId,
      actorName: actor.actorName,
      metadata: {
        name: created.name,
        category: created.category,
        ingredientLines: created.ingredients.length,
      },
    });

    return NextResponse.json(
      withIngredientNameAlias(withComputedCost(created)),
      {
        status: 201,
      },
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const parsed = validateCreateFormulationInput(payload);
      if (!parsed.ok) {
        return NextResponse.json(
          { error: { message: parsed.message } },
          { status: 400 },
        );
      }

      const totalIngredientMass = parsed.data.items.reduce(
        (sum, item) =>
          sum +
          toDosageGrams({
            amount: item.amount,
            unit: item.unit,
            density: null,
          }),
        0,
      );

      const normalizedTemperatureC =
        parsed.data.desiredBrix === null
          ? null
          : (parsed.data.temperatureC ?? 20);

      const correctedBrix =
        parsed.data.desiredBrix === null || normalizedTemperatureC === null
          ? null
          : applyBrixTemperatureCorrection(
              parsed.data.desiredBrix,
              normalizedTemperatureC,
            );

      const densityGPerML =
        correctedBrix === null ? null : brixToDensityGPerML(correctedBrix);
      const targetMassPerLiterG =
        densityGPerML === null ? null : densityGPerML * 1000;
      const waterGramsPerLiter =
        targetMassPerLiterG === null
          ? null
          : Math.max(0, targetMassPerLiterG - totalIngredientMass);

      const created = createDevFormulation({
        ...parsed.data,
        temperatureC: normalizedTemperatureC,
        correctedBrix,
        densityGPerML,
        targetMassPerLiterG,
        waterGramsPerLiter,
      });
      if ("error" in created) {
        return NextResponse.json(
          { error: { message: created.error } },
          { status: created.error.includes("only be added once") ? 409 : 400 },
        );
      }

      await logActivity({
        shelfLifeTestId: null,
        entityType: "FORMULATION",
        entityId: created.id,
        action: "CREATE",
        actorId: actor.actorId,
        actorName: actor.actorName,
        metadata: {
          name: created.name,
          category: created.category,
          ingredientLines: created.ingredients.length,
          source: "dev-fallback",
        },
      });

      return NextResponse.json(
        withIngredientNameAlias(withComputedCost(created)),
        { status: 201 },
      );
    }

    if (!env.isProduction) {
      const parsed = validateCreateFormulationInput(payload);
      if (parsed.ok) {
        const totalIngredientMass = parsed.data.items.reduce(
          (sum, item) =>
            sum +
            toDosageGrams({
              amount: item.amount,
              unit: item.unit,
              density: null,
            }),
          0,
        );

        const normalizedTemperatureC =
          parsed.data.desiredBrix === null
            ? null
            : (parsed.data.temperatureC ?? 20);

        const correctedBrix =
          parsed.data.desiredBrix === null || normalizedTemperatureC === null
            ? null
            : applyBrixTemperatureCorrection(
                parsed.data.desiredBrix,
                normalizedTemperatureC,
              );

        const densityGPerML =
          correctedBrix === null ? null : brixToDensityGPerML(correctedBrix);
        const targetMassPerLiterG =
          densityGPerML === null ? null : densityGPerML * 1000;
        const waterGramsPerLiter =
          targetMassPerLiterG === null
            ? null
            : Math.max(0, targetMassPerLiterG - totalIngredientMass);

        const created = createDevFormulation({
          ...parsed.data,
          temperatureC: normalizedTemperatureC,
          correctedBrix,
          densityGPerML,
          targetMassPerLiterG,
          waterGramsPerLiter,
        });
        if (!("error" in created)) {
          await logActivity({
            shelfLifeTestId: null,
            entityType: "FORMULATION",
            entityId: created.id,
            action: "CREATE",
            actorId: actor.actorId,
            actorName: actor.actorName,
            metadata: {
              name: created.name,
              category: created.category,
              ingredientLines: created.ingredients.length,
              source: "dev-fallback-nonprod",
            },
          });
          return NextResponse.json(withComputedCost(created), { status: 201 });
        }
      }
    }

    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: error.status },
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error: {
              message:
                "Each ingredient can only be added once per formulation.",
            },
          },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to create formulation.",
        },
      },
      { status: 500 },
    );
  }
}
