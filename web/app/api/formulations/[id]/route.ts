import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@/generated/prisma/client/client";
import { prisma } from "@/lib/prisma";
import {
  calculateFormulationBatchCost,
  resolveBasePricePerKg,
  validateCreateFormulationInput,
} from "@/lib/formulation";
import {
  applyBrixTemperatureCorrection,
  brixToDensityGPerML,
} from "@/lib/brix";
import {
  deleteDevFormulation,
  isDatabaseUnavailable,
  updateDevFormulation,
} from "@/lib/dev-data-store";
import { getActivityActorFromRequest, logActivity } from "@/lib/activity";
import { authOptions } from "@/lib/auth";
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

async function resolveAuthenticatedUserId() {
  const session = await getServerSession(authOptions).catch(() => null);
  return session?.user?.id?.trim() || null;
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const payload = await req.json().catch(() => null);
  const actor = getActivityActorFromRequest(req);
  const userId = await resolveAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json(
      { error: { message: "Unauthorized." } },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const parsed = validateCreateFormulationInput(payload);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: { message: parsed.message } },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const before = await prisma.formulation.findFirst({
      where: { id, user: { is: { id: userId } } },
      include: {
        ingredients: {
          select: {
            ingredientId: true,
            amount: true,
            unit: true,
            dosageGrams: true,
          },
        },
      },
    });

    if (!before) {
      return NextResponse.json(
        { error: { message: "Formulation not found." } },
        { status: 404 },
      );
    }
    const existingIds = data.items
      .map((item) => item.ingredientId)
      .filter((item): item is string => Boolean(item));

    const existingIngredients =
      existingIds.length === 0
        ? []
        : await prisma.ingredient.findMany({
            where: { id: { in: existingIds } },
            select: {
              id: true,
              ingredientName: true,
              pricePerKgEur: true,
            },
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
      const effective = await getEffectiveIngredientSpec(ingredientId, {
        formulationId: id,
      });
      effectiveByIngredientId.set(ingredientId, effective);
    }

    for (const item of data.items) {
      const ingredient = ingredientById.get(item.ingredientId);
      if (!ingredient) {
        continue;
      }

      const effective = effectiveByIngredientId.get(item.ingredientId);
      const basePrice = resolveBasePricePerKg({
        ingredientName: effective?.ingredientName ?? ingredient.ingredientName,
        pricePerKgEur:
          effective?.effectivePricePerKgEur ?? ingredient.pricePerKgEur,
      });
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
              message: `Ingredient "${effective?.ingredientName ?? ingredient.ingredientName}" has no usable base price. Please set a base price or add a valid price override.`,
            },
          },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.formulation.findFirst({
        where: { id, user: { is: { id: userId } } },
        select: { id: true },
      });

      if (!existing) {
        throw new HttpError(404, "Formulation not found.");
      }

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

      const uniqueCount = new Set(
        resolvedItems.map((item) => item.ingredientId),
      ).size;
      if (uniqueCount !== resolvedItems.length) {
        throw new HttpError(
          409,
          "Each ingredient can only be added once per formulation.",
        );
      }

      return tx.formulation.update({
        where: { id },
        data: {
          ...(() => {
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
              correctedBrix === null
                ? null
                : brixToDensityGPerML(correctedBrix);

            const targetMassPerLiterG =
              densityGPerML === null ? null : densityGPerML * 1000;

            const waterGramsPerLiter =
              targetMassPerLiterG === null
                ? null
                : Math.max(0, targetMassPerLiterG - totalIngredientMass);

            return {
              desiredBrix: data.desiredBrix,
              temperatureC: normalizedTemperatureC,
              correctedBrix,
              densityGPerML,
              targetMassPerLiterG,
              waterGramsPerLiter,
            };
          })(),
          name: data.name,
          category: data.category,
          targetBrix: data.targetBrix,
          targetPH: data.targetPH,
          co2GPerL: data.co2GPerL,
          notes: data.notes,
          ingredients: {
            deleteMany: {},
            create: resolvedItems.map((item) => ({
              ingredientId: item.ingredientId,
              amount: item.amount,
              unit: item.unit,
              dosageGrams: item.dosageGrams,
              priceOverridePerKg: item.priceOverridePerKg,
            })),
          },
        },
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
      });
    });

    const changedTargets: string[] = [];
    if (before.targetBrix !== updated.targetBrix)
      changedTargets.push("targetBrix");
    if (before.targetPH !== updated.targetPH) changedTargets.push("targetPH");
    if (before.co2GPerL !== updated.co2GPerL) changedTargets.push("co2GPerL");
    if (before.desiredBrix !== updated.desiredBrix)
      changedTargets.push("desiredBrix");
    if (before.temperatureC !== updated.temperatureC)
      changedTargets.push("temperatureC");
    if (before.notes !== updated.notes) changedTargets.push("notes");

    const normalizeLines = (
      lines: Array<{
        ingredientId: string;
        amount: number | null;
        unit: string | null;
        dosageGrams: number;
      }>,
    ) =>
      [...lines]
        .sort((a, b) => a.ingredientId.localeCompare(b.ingredientId))
        .map((line) => ({
          ingredientId: line.ingredientId,
          amount: line.amount ?? line.dosageGrams,
          unit: line.unit ?? "g",
        }));

    const beforeLines = JSON.stringify(normalizeLines(before.ingredients));
    const afterLines = JSON.stringify(normalizeLines(updated.ingredients));

    if (changedTargets.length > 0) {
      await logActivity({
        shelfLifeTestId: null,
        entityType: "FORMULATION",
        entityId: updated.id,
        action: "UPDATE",
        actorId: actor.actorId,
        actorName: actor.actorName,
        metadata: {
          section: "targets",
          changedFields: changedTargets,
        },
      });
    }

    if (beforeLines !== afterLines) {
      await logActivity({
        shelfLifeTestId: null,
        entityType: "FORMULATION_LINE",
        entityId: updated.id,
        action: "UPDATE",
        actorId: actor.actorId,
        actorName: actor.actorName,
        metadata: {
          section: "ingredient-lines",
          lineCount: updated.ingredients.length,
        },
      });
    }

    return NextResponse.json(
      withIngredientNameAlias(withComputedCost(updated)),
    );
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const { id } = await params;
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

      const updated = updateDevFormulation(id, {
        ...parsed.data,
        temperatureC: normalizedTemperatureC,
        correctedBrix,
        densityGPerML,
        targetMassPerLiterG,
        waterGramsPerLiter,
      });
      if ("error" in updated) {
        return NextResponse.json(
          { error: { message: updated.error } },
          { status: updated.error === "Formulation not found." ? 404 : 400 },
        );
      }

      await logActivity({
        shelfLifeTestId: null,
        entityType: "FORMULATION",
        entityId: updated.id,
        action: "UPDATE",
        actorId: actor.actorId,
        actorName: actor.actorName,
        metadata: {
          source: "dev-fallback",
        },
      });

      return NextResponse.json(
        withIngredientNameAlias(withComputedCost(updated)),
      );
    }

    if (error instanceof HttpError) {
      return NextResponse.json(
        { error: { message: error.message } },
        { status: error.status },
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: { message: "Formulation not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to update formulation.",
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await resolveAuthenticatedUserId();

  if (!userId) {
    return NextResponse.json(
      { error: { message: "Unauthorized." } },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const deleted = await prisma.formulation.deleteMany({
      where: { id, user: { is: { id: userId } } },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: { message: "Formulation not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      const { id } = await params;
      const deleted = deleteDevFormulation(id);
      if (!deleted) {
        return NextResponse.json(
          { error: { message: "Formulation not found." } },
          { status: 404 },
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: { message: "Formulation not found." } },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete formulation.",
        },
      },
      { status: 500 },
    );
  }
}
