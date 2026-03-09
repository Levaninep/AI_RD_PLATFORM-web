import {
  getDevIngredientById,
  isDatabaseUnavailable,
  listDevIngredients,
  type DevIngredient,
} from "@/lib/dev-data-store";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export type IngredientKnowledgeRecord = {
  id: string;
  name: string;
  category: string;
  brix: number | null;
  acidity: number | null;
  density: number | null;
  pricePerKg: number | null;
  sugar: number | null;
  kcal: number | null;
  singleStrengthBrix: number | null;
};

const ingredientSelect = {
  id: true,
  ingredientName: true,
  category: true,
  brixPercent: true,
  titratableAcidityPercent: true,
  densityKgPerL: true,
  pricePerKgEur: true,
  sugars: true,
  energyKcal: true,
  singleStrengthBrix: true,
} as const;

function mapDevIngredient(record: DevIngredient): IngredientKnowledgeRecord {
  return {
    id: record.id,
    name: record.ingredientName,
    category: record.category,
    brix: record.brixPercent,
    acidity: record.titratableAcidityPercent,
    density: record.densityKgPerL,
    pricePerKg: record.pricePerKgEur,
    sugar: record.sugars,
    kcal: record.energyKcal,
    singleStrengthBrix: record.singleStrengthBrix,
  };
}

function mapDbIngredient(record: {
  id: string;
  ingredientName: string;
  category: string;
  brixPercent: number | null;
  titratableAcidityPercent: number | null;
  densityKgPerL: number | null;
  pricePerKgEur: number;
  sugars: number | null;
  energyKcal: number | null;
  singleStrengthBrix: number | null;
}): IngredientKnowledgeRecord {
  return {
    id: record.id,
    name: record.ingredientName,
    category: record.category,
    brix: record.brixPercent,
    acidity: record.titratableAcidityPercent,
    density: record.densityKgPerL,
    pricePerKg: record.pricePerKgEur,
    sugar: record.sugars,
    kcal: record.energyKcal,
    singleStrengthBrix: record.singleStrengthBrix,
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

function scoreIngredientMatch(
  message: string,
  ingredient: IngredientKnowledgeRecord,
) {
  const normalizedMessage = message.toLowerCase();
  const normalizedName = ingredient.name.toLowerCase();

  if (normalizedMessage.includes(normalizedName)) {
    return normalizedName.length + 50;
  }

  return normalizedName
    .split(/\s+/)
    .filter((token) => token.length > 2 && normalizedMessage.includes(token))
    .length;
}

export async function listIngredients(input?: {
  query?: string;
  limit?: number;
}): Promise<IngredientKnowledgeRecord[]> {
  const query = input?.query?.trim() ?? "";
  const limit = input?.limit ?? 50;

  return withFallback(
    async () => {
      const rows = await prisma.ingredient.findMany({
        where: query
          ? {
              ingredientName: {
                contains: query,
                mode: "insensitive",
              },
            }
          : undefined,
        select: ingredientSelect,
        take: limit,
        orderBy: { updatedAt: "desc" },
      });

      return rows.map(mapDbIngredient);
    },
    () =>
      listDevIngredients()
        .map(mapDevIngredient)
        .filter((item) =>
          query ? item.name.toLowerCase().includes(query.toLowerCase()) : true,
        )
        .slice(0, limit),
  );
}

export async function getIngredientById(
  id: string,
): Promise<IngredientKnowledgeRecord | null> {
  return withFallback(
    async () => {
      const row = await prisma.ingredient.findUnique({
        where: { id },
        select: ingredientSelect,
      });

      return row ? mapDbIngredient(row) : null;
    },
    () => {
      const record = getDevIngredientById(id);
      return record ? mapDevIngredient(record) : null;
    },
  );
}

export async function getIngredientByName(
  name: string,
): Promise<IngredientKnowledgeRecord | null> {
  const normalized = name.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const items = await listIngredients({ limit: 100 });
  return (
    items.find((item) => item.name.trim().toLowerCase() === normalized) ?? null
  );
}

export async function searchIngredientsByMessage(
  message: string,
  limit = 5,
): Promise<IngredientKnowledgeRecord[]> {
  const items = await listIngredients({ limit: 200 });

  return items
    .map((item) => ({ item, score: scoreIngredientMatch(message, item) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

// Future extension: add project-scoped ingredient filters and semantic ingredient search.
