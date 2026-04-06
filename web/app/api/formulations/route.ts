import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { hash } from "bcryptjs";
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
  createDevFormulation,
  isDatabaseUnavailable,
  listDevFormulations,
} from "@/lib/dev-data-store";
import { getActivityActorFromRequest, logActivity } from "@/lib/activity";
import { AUTH_SECRET, authOptions } from "@/lib/auth";
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

function isMissingColumnError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2022";
  }

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

async function resolveAuthenticatedUserId(req?: NextRequest | Request) {
  const session = await getServerSession(authOptions).catch(() => null);
  const sessionUserId = session?.user?.id?.trim() || null;
  if (sessionUserId) {
    return sessionUserId;
  }

  if (!req) {
    return null;
  }

  const tokenBaseOptions = {
    req: req as never,
    secret: AUTH_SECRET,
  };

  const token =
    (await getToken(tokenBaseOptions).catch(() => null)) ||
    (await getToken({
      ...tokenBaseOptions,
      secureCookie: true,
    }).catch(() => null)) ||
    (await getToken({
      ...tokenBaseOptions,
      secureCookie: true,
      cookieName: "__Secure-next-auth.session-token",
    }).catch(() => null));

  const tokenSub = typeof token?.sub === "string" ? token.sub.trim() : "";
  if (tokenSub) {
    return tokenSub;
  }

  const tokenEmail =
    typeof token?.email === "string" ? token.email.trim().toLowerCase() : "";
  if (!tokenEmail) {
    return null;
  }

  const user = await prisma.user
    .findUnique({
      where: { email: tokenEmail },
      select: { id: true },
    })
    .catch(() => null);

  return user?.id ?? null;
}

export async function GET(req: NextRequest) {
  const userId = await resolveAuthenticatedUserId(req);
  const allowDevNoLogin =
    !env.isProduction && env.ALLOW_DEV_NO_LOGIN === "true";

  if (!userId && !allowDevNoLogin) {
    return NextResponse.json(
      { error: { message: "Unauthorized." } },
      { status: 401 },
    );
  }

  try {
    // Show user-owned formulations, plus orphaned ones (userId=null) in dev mode
    const where = userId
      ? allowDevNoLogin
        ? { OR: [{ user: { is: { id: userId } } }, { userId: null }] }
        : { user: { is: { id: userId } } }
      : undefined;

    // Claim orphaned formulations for the authenticated user
    if (userId && allowDevNoLogin) {
      await prisma.formulation
        .updateMany({ where: { userId: null }, data: { userId } })
        .catch(() => null);
    }

    let formulations;
    try {
      formulations = await prisma.formulation.findMany({
        where,
        include: {
          ingredients: {
            include: {
              ingredient: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }

      // Legacy-safe read path for databases that don't yet have newer columns.
      formulations = await prisma.formulation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          userId: true,
          name: true,
          category: true,
          targetBrix: true,
          targetPH: true,
          co2GPerL: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          ingredients: {
            select: {
              id: true,
              formulationId: true,
              ingredientId: true,
              amount: true,
              unit: true,
              dosageGrams: true,
              priceOverridePerKg: true,
              ingredient: {
                select: {
                  id: true,
                  ingredientName: true,
                  pricePerKgEur: true,
                },
              },
            },
          },
        },
      });
    }

    return NextResponse.json(
      formulations.map((item) =>
        withIngredientNameAlias(withComputedCost(item)),
      ),
    );
  } catch (error) {
    if (isDatabaseUnavailable(error) && !env.isProduction) {
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

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  const actor = getActivityActorFromRequest(req);
  let userId = await resolveAuthenticatedUserId(req);
  const allowDevNoLogin =
    !env.isProduction && env.ALLOW_DEV_NO_LOGIN === "true";

  if (!userId && !allowDevNoLogin) {
    return NextResponse.json(
      { error: { message: "Unauthorized." } },
      { status: 401 },
    );
  }

  // Ensure the authenticated user exists in the DB.
  // If the JWT carries an id/email but the User row is missing (e.g. dev-mode
  // in-memory auth), auto-provision the row so the FK is satisfied and the
  // formulation is correctly owned.
  if (userId) {
    const userExists = await prisma.user
      .findUnique({ where: { id: userId }, select: { id: true } })
      .catch(() => null);

    if (!userExists) {
      // Try to recover the email from the session / token so we can create the row.
      const session = await getServerSession(authOptions).catch(() => null);
      const email =
        session?.user?.email?.trim().toLowerCase() ||
        (
          await getToken({
            req: req as never,
            secret: AUTH_SECRET,
          }).catch(() => null)
        )?.email
          ?.toString()
          .trim()
          .toLowerCase() ||
        null;

      if (email) {
        // Check if a user with this email already exists (id mismatch)
        const byEmail = await prisma.user
          .findUnique({ where: { email }, select: { id: true } })
          .catch(() => null);

        if (byEmail) {
          // Reuse the existing DB user instead of the stale token id
          userId = byEmail.id;
        } else {
          // Create the user row with a placeholder password
          const created = await prisma.user
            .create({
              data: {
                id: userId,
                email,
                password: await hash("placeholder", 12),
              },
              select: { id: true },
            })
            .catch(() => null);

          if (!created) {
            userId = null;
          }
        }
      } else {
        userId = null;
      }
    }
  }

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
      const effective = await getEffectiveIngredientSpec(ingredientId, {});
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

      const ingredientLines = {
        create: resolvedItems.map((item) => ({
          ingredientId: item.ingredientId,
          amount: item.amount,
          unit: item.unit,
          dosageGrams: item.dosageGrams,
          priceOverridePerKg: item.priceOverridePerKg,
        })),
      };

      const baseData = {
        name: data.name,
        category: data.category,
        userId,
        targetBrix: data.targetBrix,
        targetPH: data.targetPH,
        co2GPerL: data.co2GPerL,
        notes: data.notes,
        ingredients: ingredientLines,
      };

      const selectShape = {
        id: true,
        name: true,
        category: true,
        targetBrix: true,
        targetPH: true,
        co2GPerL: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        ingredients: {
          select: {
            id: true,
            ingredientId: true,
            amount: true,
            unit: true,
            dosageGrams: true,
            priceOverridePerKg: true,
            ingredient: {
              select: {
                id: true,
                ingredientName: true,
                pricePerKgEur: true,
              },
            },
          },
        },
      } as const;

      let formulation;
      try {
        formulation = await tx.formulation.create({
          data: {
            ...baseData,
            desiredBrix: data.desiredBrix,
            temperatureC: normalizedTemperatureC,
            correctedBrix,
            densityGPerML,
            targetMassPerLiterG,
            waterGramsPerLiter,
          },
          select: selectShape,
        });
      } catch (error) {
        if (!isMissingColumnError(error)) {
          throw error;
        }

        formulation = await tx.formulation.create({
          data: baseData,
          select: selectShape,
        });
      }

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
    if (isDatabaseUnavailable(error) && !env.isProduction) {
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
