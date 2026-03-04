import { Prisma } from "@/generated/prisma/client/client";
import type { FormulationItemInput } from "@/lib/formulation";

export type DevIngredient = {
  id: string;
  ingredientName: string;
  name: string;
  category: string;
  pricePerKgEur: number;
  pricePerKg: number;
  supplier: string;
  countryOfOrigin: string;
  densityKgPerL: number | null;
  density: number | null;
  brixPercent: number | null;
  brix: number | null;
  singleStrengthBrix: number | null;
  titratableAcidityPercent: number | null;
  titratableAcidity: number | null;
  pH: number | null;
  co2SolubilityRelevant: boolean;
  waterContentPercent: number | null;
  waterContent: number | null;
  shelfLifeMonths: number | null;
  storageConditions: string | null;
  allergenInfo: string | null;
  vegan: boolean;
  natural: boolean;
  notes: string | null;
  coaFileUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DevFormulationIngredient = {
  id: string;
  formulationId: string;
  ingredientId: string;
  amount: number;
  unit: "kg" | "g" | "L" | "mL";
  dosageGrams: number;
  priceOverridePerKg: number | null;
  ingredient: DevIngredient;
};

export type DevFormulation = {
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
  createdAt: Date;
  updatedAt: Date;
  ingredients: DevFormulationIngredient[];
};

export type DevUser = {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DevIngredientOverride = {
  id: string;
  ingredientId: string;
  scopeType: string;
  scopeId: string | null;
  overridePricePerKgEur: number | null;
  overrideDensityKgPerL: number | null;
  overrideBrixPercent: number | null;
  overrideTitratableAcidityPercent: number | null;
  overridePH: number | null;
  overrideWaterContentPercent: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type DevStore = {
  ingredients: DevIngredient[];
  ingredientOverrides: DevIngredientOverride[];
  formulations: DevFormulation[];
  users: DevUser[];
};

const DEV_INGREDIENTS_SEED = [
  {
    name: "Apple Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Lemon Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Cherry Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Orange Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Mandarin Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Pear Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Apple Juice Concentrate Cloudy",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "White Grape Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Red Grape Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Pomegranate Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Quince Juice Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Red Grapefruit Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Passion Fruit Concentrate",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Peach Puree",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Plum Puree",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Quince Puree",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Apple Puree",
    category: "Juice",
    supplier: "Template Import",
    pricePerKg: 0,
  },
  {
    name: "Water",
    category: "Other",
    supplier: "Template Import",
    pricePerKg: 0,
  },
] as const;

function mapSeedCategory(raw: string): string {
  const normalized = raw.trim().toLowerCase();
  if (normalized.includes("juice")) {
    return "Juice";
  }
  if (normalized === "sweetener") {
    return "Sweetener";
  }
  if (normalized === "flavor") {
    return "Flavor";
  }
  if (normalized === "extract") {
    return "Extract";
  }
  if (normalized === "acid") {
    return "Acid";
  }
  return "Other";
}

function densityAndBrixForIngredient(name: string): {
  densityKgPerL: number | null;
  brixPercent: number | null;
  singleStrengthBrix: number | null;
} {
  const normalized = name.trim().toLowerCase();

  const exact: Record<
    string,
    {
      densityKgPerL: number;
      brixPercent: number;
      singleStrengthBrix: number | null;
    }
  > = {
    "apple juice concentrate": {
      densityKgPerL: 1.347,
      brixPercent: 70.0,
      singleStrengthBrix: 11.5,
    },
    "lemon juice concentrate": {
      densityKgPerL: 1.228,
      brixPercent: 48.0,
      singleStrengthBrix: 8.0,
    },
    "cherry juice concentrate": {
      densityKgPerL: 1.32,
      brixPercent: 65.0,
      singleStrengthBrix: 15.5,
    },
    "orange juice concentrate": {
      densityKgPerL: 1.233,
      brixPercent: 50.0,
      singleStrengthBrix: 11.8,
    },
    "mandarin juice concentrate": {
      densityKgPerL: 1.288,
      brixPercent: 60.0,
      singleStrengthBrix: 11.2,
    },
    "pear juice concentrate": {
      densityKgPerL: 1.347,
      brixPercent: 70.0,
      singleStrengthBrix: 12.0,
    },
    "apple juice concentrate cloudy": {
      densityKgPerL: 1.347,
      brixPercent: 70.0,
      singleStrengthBrix: 11.5,
    },
    "white grape juice concentrate": {
      densityKgPerL: 1.347,
      brixPercent: 70.0,
      singleStrengthBrix: 16.0,
    },
    "red grape juice concentrate": {
      densityKgPerL: 1.347,
      brixPercent: 70.0,
      singleStrengthBrix: 16.0,
    },
    "pomegranate juice concentrate": {
      densityKgPerL: 1.32,
      brixPercent: 65.0,
      singleStrengthBrix: 16.5,
    },
    "quince juice concentrate": {
      densityKgPerL: 1.32,
      brixPercent: 65.0,
      singleStrengthBrix: 13.0,
    },
    "red grapefruit concentrate": {
      densityKgPerL: 1.32,
      brixPercent: 65.0,
      singleStrengthBrix: 10.5,
    },
    "passion fruit concentrate": {
      densityKgPerL: 1.233,
      brixPercent: 50.0,
      singleStrengthBrix: 13.5,
    },
    "peach puree": {
      densityKgPerL: 1.122,
      brixPercent: 30.3,
      singleStrengthBrix: null,
    },
    "plum puree": {
      densityKgPerL: 1.122,
      brixPercent: 30.3,
      singleStrengthBrix: null,
    },
    "quince puree": {
      densityKgPerL: 1.087,
      brixPercent: 21.0,
      singleStrengthBrix: null,
    },
    "apple puree": {
      densityKgPerL: 1.122,
      brixPercent: 30.3,
      singleStrengthBrix: null,
    },
    water: { densityKgPerL: 1.0, brixPercent: 0, singleStrengthBrix: null },
  };

  if (exact[normalized]) {
    return exact[normalized];
  }

  if (
    normalized.includes("apple") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return {
      densityKgPerL: 1.347,
      brixPercent: 70.0,
      singleStrengthBrix: 11.5,
    };
  }
  if (
    normalized.includes("lemon") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return { densityKgPerL: 1.228, brixPercent: 48.0, singleStrengthBrix: 8.0 };
  }
  if (
    normalized.includes("cherry") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return { densityKgPerL: 1.32, brixPercent: 65.0, singleStrengthBrix: 15.5 };
  }
  if (
    normalized.includes("orange") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return {
      densityKgPerL: 1.233,
      brixPercent: 50.0,
      singleStrengthBrix: 11.8,
    };
  }
  if (
    normalized.includes("mandarin") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return {
      densityKgPerL: 1.288,
      brixPercent: 60.0,
      singleStrengthBrix: 11.2,
    };
  }
  if (normalized.includes("pear") && normalized.includes("conc")) {
    return {
      densityKgPerL: 1.347,
      brixPercent: 70.0,
      singleStrengthBrix: 12.0,
    };
  }
  if (normalized.includes("white grape") && normalized.includes("conc")) {
    return {
      densityKgPerL: 1.347,
      brixPercent: 70.0,
      singleStrengthBrix: 16.0,
    };
  }
  if (normalized.includes("red grape") && normalized.includes("conc")) {
    return {
      densityKgPerL: 1.347,
      brixPercent: 70.0,
      singleStrengthBrix: 16.0,
    };
  }
  if (normalized.includes("pomegranate") && normalized.includes("conc")) {
    return { densityKgPerL: 1.32, brixPercent: 65.0, singleStrengthBrix: 16.5 };
  }
  if (
    normalized.includes("quince") &&
    normalized.includes("juice") &&
    normalized.includes("conc")
  ) {
    return { densityKgPerL: 1.32, brixPercent: 65.0, singleStrengthBrix: 13.0 };
  }
  if (normalized.includes("grapefruit") && normalized.includes("conc")) {
    return { densityKgPerL: 1.32, brixPercent: 65.0, singleStrengthBrix: 10.5 };
  }
  if (normalized.includes("passion") && normalized.includes("conc")) {
    return {
      densityKgPerL: 1.233,
      brixPercent: 50.0,
      singleStrengthBrix: 13.5,
    };
  }
  if (normalized.includes("peach") && normalized.includes("puree")) {
    return {
      densityKgPerL: 1.122,
      brixPercent: 30.3,
      singleStrengthBrix: null,
    };
  }
  if (normalized.includes("plum") && normalized.includes("puree")) {
    return {
      densityKgPerL: 1.122,
      brixPercent: 30.3,
      singleStrengthBrix: null,
    };
  }
  if (normalized.includes("quince") && normalized.includes("puree")) {
    return {
      densityKgPerL: 1.087,
      brixPercent: 21.0,
      singleStrengthBrix: null,
    };
  }
  if (normalized === "water") {
    return { densityKgPerL: 1.0, brixPercent: 0, singleStrengthBrix: null };
  }

  return { densityKgPerL: null, brixPercent: null, singleStrengthBrix: null };
}

const globalForDevStore = globalThis as unknown as {
  __devStore?: DevStore;
};

const store: DevStore = globalForDevStore.__devStore ?? {
  ingredients: [],
  ingredientOverrides: [],
  formulations: [],
  users: [],
};

if (!globalForDevStore.__devStore) {
  globalForDevStore.__devStore = store;
}

const seededNames = new Set(
  store.ingredients.map((item) => item.ingredientName),
);
const now = Date.now();

for (const [index, item] of DEV_INGREDIENTS_SEED.entries()) {
  if (seededNames.has(item.name)) {
    continue;
  }

  const timestamp = new Date(now - index * 1000);
  const metrics = densityAndBrixForIngredient(item.name);
  store.ingredients.push({
    id: createId("ing"),
    ingredientName: item.name,
    name: item.name,
    category: mapSeedCategory(item.category),
    pricePerKgEur: item.pricePerKg,
    pricePerKg: item.pricePerKg,
    supplier: item.supplier ?? "Internal",
    countryOfOrigin: "Unknown",
    densityKgPerL: metrics.densityKgPerL,
    density: metrics.densityKgPerL,
    brixPercent: metrics.brixPercent,
    brix: metrics.brixPercent,
    singleStrengthBrix: metrics.singleStrengthBrix,
    titratableAcidityPercent: null,
    titratableAcidity: null,
    pH: null,
    co2SolubilityRelevant:
      item.category.toLowerCase().includes("juice") ||
      item.name.toLowerCase().includes("acid"),
    waterContentPercent: null,
    waterContent: null,
    shelfLifeMonths: null,
    storageConditions: null,
    allergenInfo: null,
    vegan: false,
    natural: false,
    notes: null,
    coaFileUrl: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isDatabaseUnavailable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "ECONNREFUSED";
  }

  const errorObject =
    error != null && typeof error === "object"
      ? (error as { message?: unknown; name?: unknown })
      : null;
  const errorName = String(errorObject?.name ?? "").toLowerCase();

  const rawMessage =
    typeof error === "string"
      ? error
      : typeof errorObject?.message === "string"
        ? errorObject.message
        : error instanceof Error
          ? error.message
          : "";

  const stackMessage =
    error instanceof Error && typeof error.stack === "string"
      ? error.stack
      : "";
  const causeMessage =
    errorObject && "cause" in errorObject
      ? String((errorObject as { cause?: unknown }).cause ?? "")
      : "";
  const serializedError = (() => {
    try {
      return JSON.stringify(errorObject ?? error ?? "");
    } catch {
      return "";
    }
  })();

  const normalizedMessage =
    `${rawMessage} ${stackMessage} ${causeMessage} ${serializedError}`
      .toLowerCase()
      .replace(/\s+/g, " ");

  if (errorName.includes("prismaclientinitializationerror")) {
    return true;
  }

  if (
    normalizedMessage.includes("econnrefused") ||
    normalizedMessage.includes("can't reach database server") ||
    normalizedMessage.includes("cant reach database server")
  ) {
    return true;
  }

  return false;
}

export function listDevIngredients(): DevIngredient[] {
  return [...store.ingredients].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  );
}

export function getDevIngredientById(id: string): DevIngredient | null {
  return store.ingredients.find((item) => item.id === id) ?? null;
}

export function hasDevIngredientOverrides(ingredientId: string): boolean {
  return store.ingredientOverrides.some(
    (item) => item.ingredientId === ingredientId,
  );
}

export function countDevFormulationsUsingIngredient(
  ingredientId: string,
): number {
  return new Set(
    store.formulations
      .filter((formulation) =>
        formulation.ingredients.some(
          (line) => line.ingredientId === ingredientId,
        ),
      )
      .map((formulation) => formulation.id),
  ).size;
}

export function listDevIngredientsFiltered(input: {
  q: string;
  category?: string;
  vegan?: "all" | "true" | "false";
  natural?: "all" | "true" | "false";
  co2Relevant?: "all" | "true" | "false";
  sortBy?: "price" | "brix" | "updatedAt";
  sortOrder?: "asc" | "desc";
  limit: number;
  page?: number;
}): { items: DevIngredient[]; total: number } {
  const q = input.q.toLowerCase();
  const category = (input.category ?? "").toLowerCase();
  const vegan = input.vegan ?? "all";
  const natural = input.natural ?? "all";
  const co2Relevant = input.co2Relevant ?? "all";
  const sortBy = input.sortBy ?? "updatedAt";
  const sortOrder = input.sortOrder ?? "desc";
  const page = Math.max(1, input.page ?? 1);

  const filtered = listDevIngredients().filter((item) => {
    if (category && item.category.toLowerCase() !== category) {
      return false;
    }

    if (vegan !== "all" && item.vegan !== (vegan === "true")) {
      return false;
    }

    if (natural !== "all" && item.natural !== (natural === "true")) {
      return false;
    }

    if (
      co2Relevant !== "all" &&
      item.co2SolubilityRelevant !== (co2Relevant === "true")
    ) {
      return false;
    }

    if (!q) {
      return true;
    }

    return item.ingredientName.toLowerCase().includes(q);
  });

  filtered.sort((left, right) => {
    const direction = sortOrder === "asc" ? 1 : -1;

    if (sortBy === "price") {
      return (left.pricePerKg - right.pricePerKg) * direction;
    }

    if (sortBy === "brix") {
      return ((left.brix ?? -1) - (right.brix ?? -1)) * direction;
    }

    return (left.updatedAt.getTime() - right.updatedAt.getTime()) * direction;
  });

  const total = filtered.length;
  const start = (page - 1) * input.limit;
  const items = filtered.slice(start, start + input.limit);

  return { items, total };
}

export function createDevIngredient(input: {
  ingredientName: string;
  category: string;
  pricePerKgEur?: number;
  pricePerKg?: number;
  supplier: string;
  countryOfOrigin: string;
  densityKgPerL?: number | null;
  density?: number | null;
  brixPercent?: number | null;
  brix?: number | null;
  singleStrengthBrix?: number | null;
  titratableAcidityPercent?: number | null;
  titratableAcidity?: number | null;
  pH?: number | null;
  co2SolubilityRelevant?: boolean;
  waterContentPercent?: number | null;
  waterContent?: number | null;
  shelfLifeMonths?: number | null;
  storageConditions?: string | null;
  allergenInfo?: string | null;
  vegan?: boolean;
  natural?: boolean;
  notes?: string | null;
  coaFileUrl?: string | null;
}): DevIngredient {
  const now = new Date();
  const created: DevIngredient = {
    id: createId("ing"),
    ingredientName: input.ingredientName,
    name: input.ingredientName,
    category: input.category,
    pricePerKgEur: input.pricePerKgEur ?? input.pricePerKg ?? 0,
    pricePerKg: input.pricePerKgEur ?? input.pricePerKg ?? 0,
    supplier: input.supplier,
    countryOfOrigin: input.countryOfOrigin,
    densityKgPerL: input.densityKgPerL ?? input.density ?? null,
    density: input.densityKgPerL ?? input.density ?? null,
    brixPercent: input.brixPercent ?? input.brix ?? null,
    brix: input.brixPercent ?? input.brix ?? null,
    singleStrengthBrix: input.singleStrengthBrix ?? null,
    titratableAcidityPercent:
      input.titratableAcidityPercent ?? input.titratableAcidity ?? null,
    titratableAcidity:
      input.titratableAcidityPercent ?? input.titratableAcidity ?? null,
    pH: input.pH ?? null,
    co2SolubilityRelevant: input.co2SolubilityRelevant ?? false,
    waterContentPercent:
      input.waterContentPercent ?? input.waterContent ?? null,
    waterContent: input.waterContentPercent ?? input.waterContent ?? null,
    shelfLifeMonths: input.shelfLifeMonths ?? null,
    storageConditions: input.storageConditions ?? null,
    allergenInfo: input.allergenInfo ?? null,
    vegan: input.vegan ?? false,
    natural: input.natural ?? false,
    notes: input.notes ?? null,
    coaFileUrl: input.coaFileUrl ?? null,
    createdAt: now,
    updatedAt: now,
  };

  store.ingredients.unshift(created);
  return created;
}

export function updateDevIngredient(
  id: string,
  input: {
    ingredientName?: string;
    category?: string;
    pricePerKgEur?: number;
    pricePerKg?: number;
    supplier?: string;
    countryOfOrigin?: string;
    densityKgPerL?: number | null;
    density?: number | null;
    brixPercent?: number | null;
    brix?: number | null;
    singleStrengthBrix?: number | null;
    titratableAcidityPercent?: number | null;
    titratableAcidity?: number | null;
    pH?: number | null;
    co2SolubilityRelevant?: boolean;
    waterContentPercent?: number | null;
    waterContent?: number | null;
    shelfLifeMonths?: number | null;
    storageConditions?: string | null;
    allergenInfo?: string | null;
    vegan?: boolean;
    natural?: boolean;
    notes?: string | null;
    coaFileUrl?: string | null;
  },
): DevIngredient | null {
  const index = store.ingredients.findIndex((item) => item.id === id);
  if (index < 0) {
    return null;
  }

  const next: DevIngredient = {
    ...store.ingredients[index],
    ...input,
    name: input.ingredientName ?? store.ingredients[index].name,
    pricePerKgEur:
      input.pricePerKgEur ??
      input.pricePerKg ??
      store.ingredients[index].pricePerKgEur,
    pricePerKg:
      input.pricePerKgEur ??
      input.pricePerKg ??
      store.ingredients[index].pricePerKg,
    densityKgPerL:
      input.densityKgPerL ??
      input.density ??
      store.ingredients[index].densityKgPerL,
    density:
      input.densityKgPerL ?? input.density ?? store.ingredients[index].density,
    brixPercent:
      input.brixPercent ?? input.brix ?? store.ingredients[index].brixPercent,
    brix: input.brixPercent ?? input.brix ?? store.ingredients[index].brix,
    singleStrengthBrix:
      input.singleStrengthBrix ?? store.ingredients[index].singleStrengthBrix,
    titratableAcidityPercent:
      input.titratableAcidityPercent ??
      input.titratableAcidity ??
      store.ingredients[index].titratableAcidityPercent,
    titratableAcidity:
      input.titratableAcidityPercent ??
      input.titratableAcidity ??
      store.ingredients[index].titratableAcidity,
    waterContentPercent:
      input.waterContentPercent ??
      input.waterContent ??
      store.ingredients[index].waterContentPercent,
    waterContent:
      input.waterContentPercent ??
      input.waterContent ??
      store.ingredients[index].waterContent,
    updatedAt: new Date(),
  };

  store.ingredients[index] = next;

  for (const formulation of store.formulations) {
    formulation.ingredients = formulation.ingredients.map((line) =>
      line.ingredientId === id ? { ...line, ingredient: next } : line,
    );
  }

  return next;
}

export function deleteDevIngredient(id: string): boolean {
  const before = store.ingredients.length;
  store.ingredients = store.ingredients.filter((item) => item.id !== id);

  if (store.ingredients.length === before) {
    return false;
  }

  for (const formulation of store.formulations) {
    formulation.ingredients = formulation.ingredients.filter(
      (line) => line.ingredientId !== id,
    );
  }

  store.ingredientOverrides = store.ingredientOverrides.filter(
    (item) => item.ingredientId !== id,
  );

  return true;
}

export function createOrUpdateDevIngredientOverride(input: {
  ingredientId: string;
  scopeType: string;
  scopeId?: string | null;
  overridePricePerKgEur?: number | null;
  overrideDensityKgPerL?: number | null;
  overrideBrixPercent?: number | null;
  overrideTitratableAcidityPercent?: number | null;
  overridePH?: number | null;
  overrideWaterContentPercent?: number | null;
  notes?: string | null;
}): DevIngredientOverride {
  const normalizedScopeId = input.scopeId ?? null;
  const existingIndex = store.ingredientOverrides.findIndex(
    (item) =>
      item.ingredientId === input.ingredientId &&
      item.scopeType === input.scopeType &&
      item.scopeId === normalizedScopeId,
  );

  if (existingIndex >= 0) {
    const current = store.ingredientOverrides[existingIndex];
    const updated: DevIngredientOverride = {
      ...current,
      overridePricePerKgEur:
        input.overridePricePerKgEur !== undefined
          ? input.overridePricePerKgEur
          : current.overridePricePerKgEur,
      overrideDensityKgPerL:
        input.overrideDensityKgPerL !== undefined
          ? input.overrideDensityKgPerL
          : current.overrideDensityKgPerL,
      overrideBrixPercent:
        input.overrideBrixPercent !== undefined
          ? input.overrideBrixPercent
          : current.overrideBrixPercent,
      overrideTitratableAcidityPercent:
        input.overrideTitratableAcidityPercent !== undefined
          ? input.overrideTitratableAcidityPercent
          : current.overrideTitratableAcidityPercent,
      overridePH:
        input.overridePH !== undefined ? input.overridePH : current.overridePH,
      overrideWaterContentPercent:
        input.overrideWaterContentPercent !== undefined
          ? input.overrideWaterContentPercent
          : current.overrideWaterContentPercent,
      notes: input.notes !== undefined ? input.notes : current.notes,
      updatedAt: new Date(),
    };

    store.ingredientOverrides[existingIndex] = updated;
    return updated;
  }

  const now = new Date();
  const created: DevIngredientOverride = {
    id: createId("ovr"),
    ingredientId: input.ingredientId,
    scopeType: input.scopeType,
    scopeId: normalizedScopeId,
    overridePricePerKgEur: input.overridePricePerKgEur ?? null,
    overrideDensityKgPerL: input.overrideDensityKgPerL ?? null,
    overrideBrixPercent: input.overrideBrixPercent ?? null,
    overrideTitratableAcidityPercent:
      input.overrideTitratableAcidityPercent ?? null,
    overridePH: input.overridePH ?? null,
    overrideWaterContentPercent: input.overrideWaterContentPercent ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };

  store.ingredientOverrides.unshift(created);
  return created;
}

export function deleteDevIngredientOverride(id: string): boolean {
  const before = store.ingredientOverrides.length;
  store.ingredientOverrides = store.ingredientOverrides.filter(
    (item) => item.id !== id,
  );
  return store.ingredientOverrides.length !== before;
}

export function getDevIngredientOverrideById(
  id: string,
): DevIngredientOverride | null {
  return store.ingredientOverrides.find((item) => item.id === id) ?? null;
}

function findDevOverrideInPriority(input: {
  ingredientId: string;
  formulationId?: string | null;
  projectId?: string | null;
}): DevIngredientOverride | null {
  const scopes: Array<{ scopeType: string; scopeId: string | null }> = [
    {
      scopeType: "formulation",
      scopeId: input.formulationId ?? null,
    },
    {
      scopeType: "project",
      scopeId: input.projectId ?? null,
    },
    {
      scopeType: "global",
      scopeId: null,
    },
  ];

  for (const scope of scopes) {
    if (scope.scopeType !== "global" && !scope.scopeId) {
      continue;
    }

    const found = store.ingredientOverrides.find(
      (item) =>
        item.ingredientId === input.ingredientId &&
        item.scopeType === scope.scopeType &&
        item.scopeId === scope.scopeId,
    );

    if (found) {
      return found;
    }
  }

  return null;
}

export function getEffectiveDevIngredientSpec(input: {
  ingredientId: string;
  formulationId?: string | null;
  projectId?: string | null;
}) {
  const ingredient = store.ingredients.find(
    (item) => item.id === input.ingredientId,
  );
  if (!ingredient) {
    return null;
  }

  const override = findDevOverrideInPriority(input);

  return {
    ingredient,
    override,
    effectivePricePerKgEur:
      override?.overridePricePerKgEur ?? ingredient.pricePerKgEur,
    effectiveDensityKgPerL:
      override?.overrideDensityKgPerL ?? ingredient.densityKgPerL,
    effectiveBrixPercent:
      override?.overrideBrixPercent ?? ingredient.brixPercent,
    effectiveSingleStrengthBrix: ingredient.singleStrengthBrix,
    effectiveTitratableAcidityPercent:
      override?.overrideTitratableAcidityPercent ??
      ingredient.titratableAcidityPercent,
    effectivePH: override?.overridePH ?? ingredient.pH,
    effectiveWaterContentPercent:
      override?.overrideWaterContentPercent ?? ingredient.waterContentPercent,
    sources: {
      pricePerKgEur:
        override?.overridePricePerKgEur != null ? "overridden" : "database",
      densityKgPerL:
        override?.overrideDensityKgPerL != null ? "overridden" : "database",
      brixPercent:
        override?.overrideBrixPercent != null ? "overridden" : "database",
      singleStrengthBrix: "database",
      titratableAcidityPercent:
        override?.overrideTitratableAcidityPercent != null
          ? "overridden"
          : "database",
      pH: override?.overridePH != null ? "overridden" : "database",
      waterContentPercent:
        override?.overrideWaterContentPercent != null
          ? "overridden"
          : "database",
    },
  };
}

export function listDevFormulations(): DevFormulation[] {
  return [...store.formulations].sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  );
}

export function createDevFormulation(input: {
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
  items: FormulationItemInput[];
}): DevFormulation | { error: string } {
  const rows: DevFormulationIngredient[] = [];

  const normalizeUnit = (
    unit: FormulationItemInput["unit"],
  ): DevFormulationIngredient["unit"] => {
    if (unit === "ml") {
      return "mL";
    }

    if (unit === "%w/w") {
      return "g";
    }

    return unit;
  };

  for (const item of input.items) {
    const ingredient = store.ingredients.find(
      (entry) => entry.id === item.ingredientId,
    );

    if (!ingredient) {
      return { error: "One or more selected ingredients were not found." };
    }

    rows.push({
      id: createId("fi"),
      formulationId: "",
      ingredientId: ingredient.id,
      amount: item.amount,
      unit: normalizeUnit(item.unit),
      dosageGrams:
        item.unit === "kg"
          ? item.amount * 1000
          : item.unit === "g"
            ? item.amount
            : item.unit === "L"
              ? item.amount * (ingredient.density ?? 1) * 1000
              : (item.amount / 1000) * (ingredient.density ?? 1) * 1000,
      priceOverridePerKg: item.priceOverridePerKg ?? null,
      ingredient,
    });
  }

  const uniqueCount = new Set(rows.map((item) => item.ingredientId)).size;
  if (uniqueCount !== rows.length) {
    return { error: "Each ingredient can only be added once per formulation." };
  }

  const now = new Date();
  const formulationId = createId("form");

  const created: DevFormulation = {
    id: formulationId,
    name: input.name,
    category: input.category,
    targetBrix: input.targetBrix,
    targetPH: input.targetPH,
    co2GPerL: input.co2GPerL,
    desiredBrix: input.desiredBrix,
    temperatureC: input.temperatureC,
    correctedBrix: input.correctedBrix,
    densityGPerML: input.densityGPerML,
    targetMassPerLiterG: input.targetMassPerLiterG,
    waterGramsPerLiter: input.waterGramsPerLiter,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
    ingredients: rows.map((row) => ({ ...row, formulationId })),
  };

  store.formulations.unshift(created);
  return created;
}

export function updateDevFormulation(
  id: string,
  input: {
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
    items: FormulationItemInput[];
  },
): DevFormulation | { error: string } {
  const index = store.formulations.findIndex((item) => item.id === id);
  if (index < 0) {
    return { error: "Formulation not found." };
  }

  const rows: DevFormulationIngredient[] = [];

  const normalizeUnit = (
    unit: FormulationItemInput["unit"],
  ): DevFormulationIngredient["unit"] => {
    if (unit === "ml") {
      return "mL";
    }

    if (unit === "%w/w") {
      return "g";
    }

    return unit;
  };

  for (const item of input.items) {
    const ingredient = store.ingredients.find(
      (entry) => entry.id === item.ingredientId,
    );

    if (!ingredient) {
      return { error: "One or more selected ingredients were not found." };
    }

    rows.push({
      id: createId("fi"),
      formulationId: id,
      ingredientId: ingredient.id,
      amount: item.amount,
      unit: normalizeUnit(item.unit),
      dosageGrams:
        item.unit === "kg"
          ? item.amount * 1000
          : item.unit === "g"
            ? item.amount
            : item.unit === "L"
              ? item.amount * (ingredient.density ?? 1) * 1000
              : (item.amount / 1000) * (ingredient.density ?? 1) * 1000,
      priceOverridePerKg: item.priceOverridePerKg ?? null,
      ingredient,
    });
  }

  const uniqueCount = new Set(rows.map((item) => item.ingredientId)).size;
  if (uniqueCount !== rows.length) {
    return { error: "Each ingredient can only be added once per formulation." };
  }

  const current = store.formulations[index];
  const updated: DevFormulation = {
    ...current,
    name: input.name,
    category: input.category,
    targetBrix: input.targetBrix,
    targetPH: input.targetPH,
    co2GPerL: input.co2GPerL,
    desiredBrix: input.desiredBrix,
    temperatureC: input.temperatureC,
    correctedBrix: input.correctedBrix,
    densityGPerML: input.densityGPerML,
    targetMassPerLiterG: input.targetMassPerLiterG,
    waterGramsPerLiter: input.waterGramsPerLiter,
    notes: input.notes,
    updatedAt: new Date(),
    ingredients: rows,
  };

  store.formulations[index] = updated;
  return updated;
}

export function deleteDevFormulation(id: string): boolean {
  const before = store.formulations.length;
  store.formulations = store.formulations.filter((item) => item.id !== id);
  return store.formulations.length !== before;
}

export function findDevUserByEmail(email: string): DevUser | null {
  const target = email.trim().toLowerCase();
  if (!target) {
    return null;
  }

  const user = store.users.find((item) => item.email === target);
  return user ?? null;
}

export function createDevUser(input: {
  email: string;
  password: string;
}): DevUser | { error: string } {
  const email = input.email.trim().toLowerCase();
  if (!email) {
    return { error: "Email is required." };
  }

  const existingIndex = store.users.findIndex((item) => item.email === email);
  if (existingIndex >= 0) {
    const existing = store.users[existingIndex];
    const updated: DevUser = {
      ...existing,
      password: input.password,
      updatedAt: new Date(),
    };
    store.users[existingIndex] = updated;
    return updated;
  }

  const now = new Date();
  const created: DevUser = {
    id: createId("usr"),
    email,
    password: input.password,
    createdAt: now,
    updatedAt: now,
  };

  store.users.push(created);
  return created;
}
