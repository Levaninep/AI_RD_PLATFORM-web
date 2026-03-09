import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client/client";
import { prisma } from "@/lib/prisma";
import {
  createDevIngredient,
  deleteDevIngredient,
  isDatabaseUnavailable,
  listDevIngredientsFiltered,
  updateDevIngredient,
} from "@/lib/dev-data-store";
import {
  fromPrismaIngredientCategory,
  ingredientCreateSchema,
  ingredientQuerySchema,
  ingredientUpdateSchema,
  toPrismaIngredientCategory,
} from "@/lib/ingredient";
import { env } from "@/lib/env";
import { getEffectiveIngredientSpec } from "@/lib/ingredient-effective";

function toNull<T>(value: T | undefined): T | null {
  return value === undefined ? null : value;
}

function parseIdFromRequest(req: Request, body: unknown): string | null {
  if (typeof body === "object" && body && "id" in body) {
    const id = String((body as { id?: unknown }).id ?? "").trim();
    if (id) return id;
  }

  return new URL(req.url).searchParams.get("id")?.trim() ?? null;
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

function serializeIngredient(
  item: {
    id: string;
    ingredientName: string;
    category: string;
    supplier: string;
    countryOfOrigin: string;
    pricePerKgEur: number;
    densityKgPerL: number | null;
    brixPercent: number | null;
    singleStrengthBrix?: number | null;
    brixDensityTempC?: number | null;
    titratableAcidityPercent: number | null;
    pH: number | null;
    co2SolubilityRelevant: boolean;
    waterContentPercent: number | null;
    energyKcal?: number | null;
    energyKj?: number | null;
    fat?: number | null;
    saturates?: number | null;
    carbohydrates?: number | null;
    sugars?: number | null;
    protein?: number | null;
    salt?: number | null;
    nutritionBasis?: "PER_100G" | "PER_100ML" | null;
    shelfLifeMonths: number | null;
    storageConditions: string | null;
    allergenInfo: string | null;
    vegan: boolean;
    natural: boolean;
    notes: string | null;
    coaFileUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  },
  effective?: {
    effectivePricePerKgEur: number | null;
    effectiveDensityKgPerL: number | null;
    effectiveBrixPercent: number | null;
    effectiveSingleStrengthBrix?: number | null;
    effectiveTitratableAcidityPercent: number | null;
    effectivePH: number | null;
    effectiveWaterContentPercent: number | null;
    overrideId: string | null;
    sources: {
      pricePerKgEur: "database" | "overridden";
      densityKgPerL: "database" | "overridden";
      brixPercent: "database" | "overridden";
      singleStrengthBrix?: "database" | "overridden";
      titratableAcidityPercent: "database" | "overridden";
      pH: "database" | "overridden";
      waterContentPercent: "database" | "overridden";
    };
  },
) {
  const category = [
    "Sweetener",
    "Juice",
    "Acid",
    "Flavor",
    "Extract",
    "Other",
  ].includes(item.category)
    ? fromPrismaIngredientCategory(
        item.category as
          | "Sweetener"
          | "Juice"
          | "Acid"
          | "Flavor"
          | "Extract"
          | "Other",
      )
    : "Other";

  return {
    id: item.id,
    ingredientName: item.ingredientName,
    category,
    supplier: item.supplier,
    countryOfOrigin: item.countryOfOrigin,
    pricePerKgEur: item.pricePerKgEur,
    densityKgPerL: item.densityKgPerL,
    brixPercent: item.brixPercent,
    singleStrengthBrix: item.singleStrengthBrix ?? null,
    brixDensityTempC: item.brixDensityTempC ?? 20,
    titratableAcidityPercent: item.titratableAcidityPercent,
    pH: item.pH,
    co2SolubilityRelevant: item.co2SolubilityRelevant,
    waterContentPercent: item.waterContentPercent,
    energyKcal: item.energyKcal ?? null,
    energyKj: item.energyKj ?? null,
    fat: item.fat ?? null,
    saturates: item.saturates ?? null,
    carbohydrates: item.carbohydrates ?? null,
    sugars: item.sugars ?? null,
    protein: item.protein ?? null,
    salt: item.salt ?? null,
    nutritionBasis: item.nutritionBasis ?? "PER_100G",
    shelfLifeMonths: item.shelfLifeMonths,
    storageConditions: item.storageConditions,
    allergenInfo: item.allergenInfo,
    vegan: item.vegan,
    natural: item.natural,
    notes: item.notes,
    coaFileUrl: item.coaFileUrl,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    effectivePricePerKgEur:
      effective?.effectivePricePerKgEur ?? item.pricePerKgEur,
    effectiveDensityKgPerL:
      effective?.effectiveDensityKgPerL ?? item.densityKgPerL,
    effectiveBrixPercent: effective?.effectiveBrixPercent ?? item.brixPercent,
    effectiveSingleStrengthBrix:
      effective?.effectiveSingleStrengthBrix ?? item.singleStrengthBrix ?? null,
    effectiveTitratableAcidityPercent:
      effective?.effectiveTitratableAcidityPercent ??
      item.titratableAcidityPercent,
    effectivePH: effective?.effectivePH ?? item.pH,
    effectiveWaterContentPercent:
      effective?.effectiveWaterContentPercent ?? item.waterContentPercent,
    effectiveOverrideId: effective?.overrideId ?? null,
    valueSources: effective?.sources,
    name: item.ingredientName,
    pricePerKg: item.pricePerKgEur,
    density: item.densityKgPerL,
    brix: item.brixPercent,
    titratableAcidity: item.titratableAcidityPercent,
    waterContent: item.waterContentPercent,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = ingredientQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    vegan: url.searchParams.get("vegan") ?? undefined,
    natural: url.searchParams.get("natural") ?? undefined,
    co2Relevant: url.searchParams.get("co2Relevant") ?? undefined,
    sortBy: url.searchParams.get("sortBy") ?? undefined,
    sortOrder: url.searchParams.get("sortOrder") ?? undefined,
    includeEffective: url.searchParams.get("includeEffective") ?? undefined,
    scopeType: url.searchParams.get("scopeType") ?? undefined,
    scopeId: url.searchParams.get("scopeId") ?? undefined,
    projectId: url.searchParams.get("projectId") ?? undefined,
    formulationId: url.searchParams.get("formulationId") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: { message: parsed.error.issues[0]?.message ?? "Invalid query." },
      },
      { status: 400 },
    );
  }

  const query = parsed.data;

  try {
    const where: Prisma.IngredientWhereInput = {
      ...(query.q
        ? {
            ingredientName: {
              contains: query.q,
              mode: "insensitive",
            },
          }
        : {}),
      ...(query.category
        ? { category: toPrismaIngredientCategory(query.category) }
        : {}),
      ...(query.vegan !== "all" ? { vegan: query.vegan === "true" } : {}),
      ...(query.natural !== "all" ? { natural: query.natural === "true" } : {}),
      ...(query.co2Relevant !== "all"
        ? { co2SolubilityRelevant: query.co2Relevant === "true" }
        : {}),
    };

    const orderBy: Prisma.IngredientOrderByWithRelationInput =
      query.sortBy === "price"
        ? { pricePerKgEur: query.sortOrder }
        : query.sortBy === "brix"
          ? { brixPercent: query.sortOrder }
          : { updatedAt: query.sortOrder };

    let items: Array<{
      id: string;
      ingredientName: string;
      category: string;
      supplier: string;
      countryOfOrigin: string;
      pricePerKgEur: number;
      densityKgPerL: number | null;
      brixPercent: number | null;
      singleStrengthBrix?: number | null;
      brixDensityTempC?: number | null;
      titratableAcidityPercent: number | null;
      pH: number | null;
      co2SolubilityRelevant: boolean;
      waterContentPercent: number | null;
      energyKcal?: number | null;
      energyKj?: number | null;
      fat?: number | null;
      saturates?: number | null;
      carbohydrates?: number | null;
      sugars?: number | null;
      protein?: number | null;
      salt?: number | null;
      nutritionBasis?: "PER_100G" | "PER_100ML" | null;
      shelfLifeMonths: number | null;
      storageConditions: string | null;
      allergenInfo: string | null;
      vegan: boolean;
      natural: boolean;
      notes: string | null;
      coaFileUrl: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    let total: number;

    try {
      [items, total] = await Promise.all([
        prisma.ingredient.findMany({
          where,
          take: query.limit,
          skip: (query.page - 1) * query.limit,
          orderBy,
        }),
        prisma.ingredient.count({ where }),
      ]);
    } catch (error) {
      if (!isMissingColumnError(error)) {
        throw error;
      }

      [items, total] = await Promise.all([
        prisma.ingredient.findMany({
          where,
          take: query.limit,
          skip: (query.page - 1) * query.limit,
          orderBy,
          select: {
            id: true,
            ingredientName: true,
            category: true,
            supplier: true,
            countryOfOrigin: true,
            pricePerKgEur: true,
            densityKgPerL: true,
            brixPercent: true,
            singleStrengthBrix: true,
            brixDensityTempC: true,
            titratableAcidityPercent: true,
            pH: true,
            co2SolubilityRelevant: true,
            waterContentPercent: true,
            shelfLifeMonths: true,
            storageConditions: true,
            allergenInfo: true,
            vegan: true,
            natural: true,
            notes: true,
            coaFileUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.ingredient.count({ where }),
      ]);
    }

    const effectiveById = new Map<
      string,
      Awaited<ReturnType<typeof getEffectiveIngredientSpec>>
    >();

    if (query.includeEffective) {
      const projectId =
        query.scopeType === "project"
          ? (query.scopeId ?? null)
          : (query.projectId ?? null);
      const formulationId =
        query.scopeType === "formulation"
          ? (query.scopeId ?? null)
          : (query.formulationId ?? null);

      const effectiveRows = await Promise.all(
        items.map(async (item) => {
          try {
            return await getEffectiveIngredientSpec(item.id, {
              projectId,
              formulationId,
            });
          } catch {
            return null;
          }
        }),
      );

      for (const row of effectiveRows) {
        if (row) {
          effectiveById.set(row.ingredientId, row);
        }
      }
    }

    return NextResponse.json({
      items: items.map((item) =>
        serializeIngredient(item, effectiveById.get(item.id) ?? undefined),
      ),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    });
  } catch (error) {
    if (isDatabaseUnavailable(error) && !env.isProduction) {
      const fallback = listDevIngredientsFiltered({
        q: query.q,
        category: query.category,
        vegan: query.vegan,
        natural: query.natural,
        co2Relevant: query.co2Relevant,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
        page: query.page,
        limit: query.limit,
      });

      const effectiveById = new Map<
        string,
        Awaited<ReturnType<typeof getEffectiveIngredientSpec>>
      >();

      if (query.includeEffective) {
        const projectId =
          query.scopeType === "project"
            ? (query.scopeId ?? null)
            : (query.projectId ?? null);
        const formulationId =
          query.scopeType === "formulation"
            ? (query.scopeId ?? null)
            : (query.formulationId ?? null);

        const effectiveRows = await Promise.all(
          fallback.items.map(async (item) => {
            try {
              return await getEffectiveIngredientSpec(item.id, {
                projectId,
                formulationId,
              });
            } catch {
              return null;
            }
          }),
        );

        for (const row of effectiveRows) {
          if (row) {
            effectiveById.set(row.ingredientId, row);
          }
        }
      }

      return NextResponse.json({
        items: fallback.items.map((item) =>
          serializeIngredient(item, effectiveById.get(item.id) ?? undefined),
        ),
        page: query.page,
        limit: query.limit,
        total: fallback.total,
        totalPages: Math.max(1, Math.ceil(fallback.total / query.limit)),
      });
    }

    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Server error",
        },
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ingredientCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: parsed.error.issues[0]?.message ?? "Invalid payload.",
        },
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  try {
    const created = await prisma.ingredient.create({
      data: {
        ingredientName: payload.ingredientName,
        category: toPrismaIngredientCategory(payload.category),
        supplier: payload.supplier,
        countryOfOrigin: payload.countryOfOrigin,
        pricePerKgEur: payload.pricePerKgEur,
        densityKgPerL: toNull(payload.densityKgPerL),
        brixPercent: toNull(payload.brixPercent),
        singleStrengthBrix: toNull(payload.singleStrengthBrix),
        ...(payload.brixDensityTempC !== undefined
          ? { brixDensityTempC: payload.brixDensityTempC }
          : {}),
        titratableAcidityPercent: toNull(payload.titratableAcidityPercent),
        pH: toNull(payload.pH),
        co2SolubilityRelevant: payload.co2SolubilityRelevant ?? false,
        waterContentPercent: toNull(payload.waterContentPercent),
        energyKcal: toNull(payload.energyKcal),
        energyKj: toNull(payload.energyKj),
        fat: toNull(payload.fat),
        saturates: toNull(payload.saturates),
        carbohydrates: toNull(payload.carbohydrates),
        sugars: toNull(payload.sugars),
        protein: toNull(payload.protein),
        salt: toNull(payload.salt),
        nutritionBasis: payload.nutritionBasis ?? "PER_100G",
        shelfLifeMonths: toNull(payload.shelfLifeMonths),
        storageConditions: toNull(payload.storageConditions),
        allergenInfo: toNull(payload.allergenInfo),
        vegan: payload.vegan ?? false,
        natural: payload.natural ?? false,
        notes: toNull(payload.notes),
        coaFileUrl: toNull(payload.coaFileUrl),
        createdAt: payload.createdAt,
        updatedAt: payload.updatedAt,
      },
    });

    return NextResponse.json(serializeIngredient(created), { status: 201 });
  } catch (error) {
    if (isDatabaseUnavailable(error) && !env.isProduction) {
      const created = createDevIngredient(payload);
      return NextResponse.json(created, { status: 201 });
    }

    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Server error",
        },
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ingredientUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: parsed.error.issues[0]?.message ?? "Invalid payload.",
        },
      },
      { status: 400 },
    );
  }

  const ingredientId = parseIdFromRequest(req, body);
  if (!ingredientId) {
    return NextResponse.json(
      { error: { message: "Ingredient id is required." } },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  try {
    const updated = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        ...(payload.ingredientName !== undefined
          ? { ingredientName: payload.ingredientName }
          : {}),
        ...(payload.category !== undefined
          ? { category: toPrismaIngredientCategory(payload.category) }
          : {}),
        ...(payload.supplier !== undefined
          ? { supplier: payload.supplier }
          : {}),
        ...(payload.countryOfOrigin !== undefined
          ? { countryOfOrigin: payload.countryOfOrigin }
          : {}),
        ...(payload.pricePerKgEur !== undefined
          ? { pricePerKgEur: payload.pricePerKgEur }
          : {}),
        ...(payload.densityKgPerL !== undefined
          ? { densityKgPerL: toNull(payload.densityKgPerL) }
          : {}),
        ...(payload.brixPercent !== undefined
          ? { brixPercent: toNull(payload.brixPercent) }
          : {}),
        ...(payload.singleStrengthBrix !== undefined
          ? { singleStrengthBrix: toNull(payload.singleStrengthBrix) }
          : {}),
        ...(payload.brixDensityTempC !== undefined
          ? { brixDensityTempC: payload.brixDensityTempC }
          : {}),
        ...(payload.titratableAcidityPercent !== undefined
          ? {
              titratableAcidityPercent: toNull(
                payload.titratableAcidityPercent,
              ),
            }
          : {}),
        ...(payload.pH !== undefined ? { pH: toNull(payload.pH) } : {}),
        ...(payload.co2SolubilityRelevant !== undefined
          ? { co2SolubilityRelevant: payload.co2SolubilityRelevant }
          : {}),
        ...(payload.waterContentPercent !== undefined
          ? { waterContentPercent: toNull(payload.waterContentPercent) }
          : {}),
        ...(payload.energyKcal !== undefined
          ? { energyKcal: toNull(payload.energyKcal) }
          : {}),
        ...(payload.energyKj !== undefined
          ? { energyKj: toNull(payload.energyKj) }
          : {}),
        ...(payload.fat !== undefined ? { fat: toNull(payload.fat) } : {}),
        ...(payload.saturates !== undefined
          ? { saturates: toNull(payload.saturates) }
          : {}),
        ...(payload.carbohydrates !== undefined
          ? { carbohydrates: toNull(payload.carbohydrates) }
          : {}),
        ...(payload.sugars !== undefined
          ? { sugars: toNull(payload.sugars) }
          : {}),
        ...(payload.protein !== undefined
          ? { protein: toNull(payload.protein) }
          : {}),
        ...(payload.salt !== undefined ? { salt: toNull(payload.salt) } : {}),
        ...(payload.nutritionBasis !== undefined
          ? { nutritionBasis: payload.nutritionBasis }
          : {}),
        ...(payload.shelfLifeMonths !== undefined
          ? { shelfLifeMonths: toNull(payload.shelfLifeMonths) }
          : {}),
        ...(payload.storageConditions !== undefined
          ? { storageConditions: toNull(payload.storageConditions) }
          : {}),
        ...(payload.allergenInfo !== undefined
          ? { allergenInfo: toNull(payload.allergenInfo) }
          : {}),
        ...(payload.vegan !== undefined ? { vegan: payload.vegan } : {}),
        ...(payload.natural !== undefined ? { natural: payload.natural } : {}),
        ...(payload.notes !== undefined
          ? { notes: toNull(payload.notes) }
          : {}),
        ...(payload.coaFileUrl !== undefined
          ? { coaFileUrl: toNull(payload.coaFileUrl) }
          : {}),
      },
    });

    return NextResponse.json(serializeIngredient(updated));
  } catch (error) {
    if (isDatabaseUnavailable(error) && !env.isProduction) {
      const updated = updateDevIngredient(ingredientId, payload);
      if (!updated) {
        return NextResponse.json(
          { error: { message: "Ingredient not found." } },
          { status: 404 },
        );
      }

      return NextResponse.json(updated);
    }

    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Server error",
        },
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  const ingredientId = parseIdFromRequest(req, body);

  if (!ingredientId) {
    return NextResponse.json(
      { error: { message: "Ingredient id is required." } },
      { status: 400 },
    );
  }

  try {
    await prisma.ingredient.delete({ where: { id: ingredientId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isDatabaseUnavailable(error) && !env.isProduction) {
      const deleted = deleteDevIngredient(ingredientId);
      if (!deleted) {
        return NextResponse.json(
          { error: { message: "Ingredient not found." } },
          { status: 404 },
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Server error",
        },
      },
      { status: 500 },
    );
  }
}
