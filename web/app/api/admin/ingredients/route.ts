import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Prisma } from "@/generated/prisma/client/client";
import { prisma } from "@/lib/prisma";
import {
  countDevFormulationsUsingIngredient,
  createDevIngredient,
  hasDevIngredientOverrides,
  isDatabaseUnavailable,
  listDevIngredients,
} from "@/lib/dev-data-store";
import {
  adminIngredientInputSchema,
  adminIngredientQuerySchema,
  toDeleteBlockedMessage,
} from "@/lib/admin-ingredient";
import { isAdminToken } from "@/lib/admin-auth";
import { env } from "@/lib/env";
import { toPrismaIngredientCategory } from "@/lib/ingredient";

const AUTH_SECRET = env.NEXTAUTH_SECRET;

type AdminListItem = {
  id: string;
  ingredientName: string;
  category: string;
  supplier: string;
  countryOfOrigin: string;
  pricePerKgEur: number;
  densityKgPerL: number | null;
  brixPercent: number | null;
  singleStrengthBrix: number | null;
  titratableAcidityPercent: number | null;
  pH: number | null;
  co2SolubilityRelevant: boolean;
  waterContentPercent: number | null;
  energyKcal: number | null;
  energyKj: number | null;
  fat: number | null;
  saturates: number | null;
  carbohydrates: number | null;
  sugars: number | null;
  protein: number | null;
  salt: number | null;
  nutritionBasis: "PER_100G" | "PER_100ML";
  shelfLifeMonths: number | null;
  storageConditions: string | null;
  allergenInfo: string | null;
  vegan: boolean;
  natural: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  hasOverrides: boolean;
  formulationsCount: number;
};

function jsonUnauthorized() {
  return NextResponse.json(
    { error: { message: "Forbidden" } },
    { status: 403 },
  );
}

async function assertAdmin(req: NextRequest) {
  const token = await getToken({ req, secret: AUTH_SECRET });
  return isAdminToken(token);
}

function serialize(item: AdminListItem) {
  return {
    ...item,
    name: item.ingredientName,
  };
}

function applySort<
  T extends {
    ingredientName: string;
    updatedAt: Date;
    pricePerKgEur: number;
    brixPercent: number | null;
  },
>(
  items: T[],
  sortBy: "updatedAt" | "name" | "price" | "brix",
  sortOrder: "asc" | "desc",
): T[] {
  const direction = sortOrder === "asc" ? 1 : -1;
  return [...items].sort((left, right) => {
    if (sortBy === "name") {
      return (
        left.ingredientName.localeCompare(right.ingredientName) * direction
      );
    }

    if (sortBy === "price") {
      return (left.pricePerKgEur - right.pricePerKgEur) * direction;
    }

    if (sortBy === "brix") {
      return ((left.brixPercent ?? -1) - (right.brixPercent ?? -1)) * direction;
    }

    return (left.updatedAt.getTime() - right.updatedAt.getTime()) * direction;
  });
}

export async function GET(req: NextRequest) {
  if (!(await assertAdmin(req))) {
    return jsonUnauthorized();
  }

  const url = new URL(req.url);
  const parsed = adminIngredientQuerySchema.safeParse({
    q: url.searchParams.get("q") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    vegan: url.searchParams.get("vegan") ?? undefined,
    natural: url.searchParams.get("natural") ?? undefined,
    co2Relevant: url.searchParams.get("co2Relevant") ?? undefined,
    sortBy: url.searchParams.get("sortBy") ?? undefined,
    sortOrder: url.searchParams.get("sortOrder") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? "20",
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

    const baseItems = await prisma.ingredient.findMany({
      where,
      include: {
        _count: {
          select: {
            overrides: true,
          },
        },
      },
    });

    const withCounts = await Promise.all(
      baseItems.map(async (item) => {
        const formulations = await prisma.formulationIngredient.findMany({
          where: { ingredientId: item.id },
          select: { formulationId: true },
          distinct: ["formulationId"],
        });

        return {
          id: item.id,
          ingredientName: item.ingredientName,
          category: item.category,
          supplier: item.supplier,
          countryOfOrigin: item.countryOfOrigin,
          pricePerKgEur: item.pricePerKgEur,
          densityKgPerL: item.densityKgPerL,
          brixPercent: item.brixPercent,
          singleStrengthBrix: item.singleStrengthBrix,
          titratableAcidityPercent: item.titratableAcidityPercent,
          pH: item.pH,
          co2SolubilityRelevant: item.co2SolubilityRelevant,
          waterContentPercent: item.waterContentPercent,
          energyKcal: item.energyKcal,
          energyKj: item.energyKj,
          fat: item.fat,
          saturates: item.saturates,
          carbohydrates: item.carbohydrates,
          sugars: item.sugars,
          protein: item.protein,
          salt: item.salt,
          nutritionBasis: item.nutritionBasis,
          shelfLifeMonths: item.shelfLifeMonths,
          storageConditions: item.storageConditions,
          allergenInfo: item.allergenInfo,
          vegan: item.vegan,
          natural: item.natural,
          notes: item.notes,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          hasOverrides: item._count.overrides > 0,
          formulationsCount: formulations.length,
        } satisfies AdminListItem;
      }),
    );

    const sorted = applySort(withCounts, query.sortBy, query.sortOrder);
    const total = sorted.length;
    const start = (query.page - 1) * query.limit;

    return NextResponse.json({
      items: sorted.slice(start, start + query.limit).map(serialize),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          error: {
            message: error instanceof Error ? error.message : "Server error",
          },
        },
        { status: 500 },
      );
    }

    const q = query.q.trim().toLowerCase();
    const filtered = listDevIngredients().filter((item) => {
      if (query.category && item.category !== query.category) {
        return false;
      }
      if (query.vegan !== "all" && item.vegan !== (query.vegan === "true")) {
        return false;
      }
      if (
        query.natural !== "all" &&
        item.natural !== (query.natural === "true")
      ) {
        return false;
      }
      if (
        query.co2Relevant !== "all" &&
        item.co2SolubilityRelevant !== (query.co2Relevant === "true")
      ) {
        return false;
      }
      if (!q) {
        return true;
      }
      return item.ingredientName.toLowerCase().includes(q);
    });

    const sorted = applySort(filtered, query.sortBy, query.sortOrder);
    const total = sorted.length;
    const start = (query.page - 1) * query.limit;

    const pageItems = sorted.slice(start, start + query.limit).map((item) =>
      serialize({
        ...item,
        hasOverrides: hasDevIngredientOverrides(item.id),
        formulationsCount: countDevFormulationsUsingIngredient(item.id),
      }),
    );

    return NextResponse.json({
      items: pageItems,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    });
  }
}

export async function POST(req: NextRequest) {
  if (!(await assertAdmin(req))) {
    return jsonUnauthorized();
  }

  const body = await req.json().catch(() => null);
  const parsed = adminIngredientInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          message: parsed.error.issues[0]?.message ?? "Invalid payload.",
          issues: parsed.error.issues,
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
        densityKgPerL: payload.densityKgPerL ?? null,
        brixPercent: payload.brixPercent ?? null,
        singleStrengthBrix: payload.singleStrengthBrix ?? null,
        titratableAcidityPercent: payload.titratableAcidityPercent ?? null,
        pH: payload.pH ?? null,
        co2SolubilityRelevant: payload.co2SolubilityRelevant,
        waterContentPercent: payload.waterContentPercent ?? null,
        energyKcal: payload.energyKcal ?? null,
        energyKj: payload.energyKj ?? null,
        fat: payload.fat ?? null,
        saturates: payload.saturates ?? null,
        carbohydrates: payload.carbohydrates ?? null,
        sugars: payload.sugars ?? null,
        protein: payload.protein ?? null,
        salt: payload.salt ?? null,
        nutritionBasis: payload.nutritionBasis ?? "PER_100G",
        shelfLifeMonths: payload.shelfLifeMonths ?? null,
        storageConditions: payload.storageConditions ?? null,
        allergenInfo: payload.allergenInfo ?? null,
        vegan: payload.vegan,
        natural: payload.natural,
        notes: payload.notes ?? null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (!isDatabaseUnavailable(error)) {
      return NextResponse.json(
        {
          error: {
            message: error instanceof Error ? error.message : "Server error",
          },
        },
        { status: 500 },
      );
    }

    const created = createDevIngredient(payload);
    return NextResponse.json(created, { status: 201 });
  }
}

export function buildDeleteBlockedMessage(formulationsCount: number) {
  return toDeleteBlockedMessage(formulationsCount);
}
