export const FORMULATION_CATEGORIES = [
  "Juice",
  "Carbonated soft drink",
  "Ice Tea",
] as const;

export type FormulationCategory = (typeof FORMULATION_CATEGORIES)[number];

export type FormulationItemInput = {
  amount: number;
  unit: "kg" | "g" | "L" | "mL" | "ml" | "%w/w";
  ingredientId: string;
  priceOverridePerKg?: number | null;
};

export type CreateFormulationInput = {
  name: string;
  category: FormulationCategory;
  targetBrix: number | null;
  targetPH: number | null;
  co2GPerL: number | null;
  desiredBrix: number | null;
  temperatureC: number | null;
  notes: string | null;
  items: FormulationItemInput[];
};

export type FormulationCostIngredientLine = {
  dosageGrams: number;
  priceOverridePerKg?: number | null;
  ingredient: {
    name?: string | null;
    ingredientName?: string | null;
    pricePerKg?: number | null;
    pricePerKgEur?: number | null;
  };
};

export const WATER_BASE_PRICE_PER_KG = 0.00001;

export function isWaterIngredientName(name?: string | null): boolean {
  return (name ?? "").trim().toLowerCase() === "water";
}

export function resolveBasePricePerKg(input: {
  name?: string | null;
  ingredientName?: string | null;
  pricePerKg?: number | null;
  pricePerKgEur?: number | null;
}): number | null {
  const directPrice = input.pricePerKgEur ?? input.pricePerKg ?? null;
  if (directPrice != null && Number.isFinite(directPrice) && directPrice > 0) {
    return directPrice;
  }

  const ingredientName = input.ingredientName ?? input.name;
  if (isWaterIngredientName(ingredientName)) {
    return WATER_BASE_PRICE_PER_KG;
  }

  return null;
}

function hasUpToThreeDecimals(value: number): boolean {
  const rounded = Math.round(value * 1000) / 1000;
  return Math.abs(rounded - value) < 1e-9;
}

function roundCostValue(value: number): number {
  if (value > 0 && value < 0.01) {
    return Number(value.toFixed(5));
  }

  return Number(value.toFixed(4));
}

export function getEffectivePricePerKg(input: {
  basePricePerKg: number | null;
  overridePricePerKg?: number | null;
  useOverride?: boolean;
}): number {
  const { basePricePerKg, overridePricePerKg, useOverride = true } = input;

  if (
    useOverride &&
    overridePricePerKg != null &&
    Number.isFinite(overridePricePerKg) &&
    overridePricePerKg > 0
  ) {
    return overridePricePerKg;
  }

  if (
    basePricePerKg != null &&
    Number.isFinite(basePricePerKg) &&
    basePricePerKg > 0
  ) {
    return basePricePerKg;
  }

  return 0;
}

function toOptionalNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function isFormulationCategory(value: string): value is FormulationCategory {
  return FORMULATION_CATEGORIES.includes(value as FormulationCategory);
}

export function calculateFormulationBatchCost(
  lines: FormulationCostIngredientLine[],
): { totalGrams: number; totalCostUSD: number; costPerKgUSD: number } {
  const totalGrams = lines.reduce((sum, line) => sum + line.dosageGrams, 0);
  const totalCostUSD = lines.reduce(
    (sum, line) =>
      sum +
      (line.dosageGrams / 1000) *
        getEffectivePricePerKg({
          basePricePerKg: resolveBasePricePerKg(line.ingredient),
          overridePricePerKg: line.priceOverridePerKg,
          useOverride: line.priceOverridePerKg != null,
        }),
    0,
  );
  const totalKg = totalGrams / 1000;
  const costPerKgUSD = totalKg > 0 ? totalCostUSD / totalKg : 0;

  return {
    totalGrams: Number(totalGrams.toFixed(4)),
    totalCostUSD: roundCostValue(totalCostUSD),
    costPerKgUSD: roundCostValue(costPerKgUSD),
  };
}

export function validateCreateFormulationInput(
  payload: unknown,
): { ok: true; data: CreateFormulationInput } | { ok: false; message: string } {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, message: "Invalid request payload." };
  }

  const candidate = payload as {
    name?: unknown;
    category?: unknown;
    targetBrix?: unknown;
    targetPH?: unknown;
    co2GPerL?: unknown;
    desiredBrix?: unknown;
    temperatureC?: unknown;
    notes?: unknown;
    items?: unknown;
  };

  const name = String(candidate.name ?? "").trim();
  const category = String(candidate.category ?? "").trim();
  const targetBrix = toOptionalNumber(candidate.targetBrix);
  const targetPH = toOptionalNumber(candidate.targetPH);
  const rawCo2GPerL = toOptionalNumber(candidate.co2GPerL);
  const desiredBrix = toOptionalNumber(candidate.desiredBrix);
  const temperatureC = toOptionalNumber(candidate.temperatureC);
  const notesText = String(candidate.notes ?? "").trim();

  if (name.length < 2) {
    return { ok: false, message: "Name must be at least 2 characters." };
  }

  if (!category) {
    return { ok: false, message: "Category is required." };
  }

  if (!isFormulationCategory(category)) {
    return {
      ok: false,
      message:
        "Invalid category. Allowed: Juice, Carbonated soft drink, Ice Tea",
    };
  }

  if (!Array.isArray(candidate.items) || candidate.items.length === 0) {
    return { ok: false, message: "At least one item is required." };
  }

  if (targetBrix !== null && !Number.isFinite(targetBrix)) {
    return { ok: false, message: "Target Brix must be a valid number." };
  }

  if (targetPH !== null && !Number.isFinite(targetPH)) {
    return { ok: false, message: "Target pH must be a valid number." };
  }

  if (desiredBrix !== null && !Number.isFinite(desiredBrix)) {
    return { ok: false, message: "Desired Brix must be a valid number." };
  }

  if (temperatureC !== null && !Number.isFinite(temperatureC)) {
    return { ok: false, message: "Temperature must be a valid number." };
  }

  let co2GPerL: number | null = null;
  if (category === "Carbonated soft drink") {
    if (rawCo2GPerL === null) {
      return {
        ok: false,
        message: "CO₂ (g/L) is required for Carbonated soft drink.",
      };
    }

    if (!Number.isFinite(rawCo2GPerL)) {
      return {
        ok: false,
        message: "CO₂ (g/L) must be a valid number.",
      };
    }

    if (rawCo2GPerL < 2 || rawCo2GPerL > 9) {
      return {
        ok: false,
        message: "CO₂ (g/L) must be between 2.0 and 9.0.",
      };
    }

    co2GPerL = rawCo2GPerL;
  }

  const items: FormulationItemInput[] = [];
  let totalGrams = 0;

  for (const rawItem of candidate.items) {
    if (typeof rawItem !== "object" || rawItem === null) {
      return { ok: false, message: "Item rows are invalid." };
    }

    const row = rawItem as {
      amount?: unknown;
      unit?: unknown;
      dosageGrams?: unknown;
      ingredientId?: unknown;
      priceOverridePerKg?: unknown;
    };

    const amountRaw = row.amount ?? row.dosageGrams;
    const amount = Number(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        ok: false,
        message: "Each item amount value must be greater than 0.",
      };
    }

    const unitRaw = String(
      row.unit ?? (row.amount == null ? "g" : ""),
    ).trim() as FormulationItemInput["unit"];

    if (!["kg", "g", "L", "mL", "ml", "%w/w"].includes(unitRaw)) {
      return {
        ok: false,
        message: "Each item unit must be one of: kg, g, L, mL, ml, %w/w.",
      };
    }

    const ingredientId = String(row.ingredientId ?? "").trim();
    if (!ingredientId) {
      return {
        ok: false,
        message: "Each item must include ingredientId.",
      };
    }

    let priceOverridePerKg: number | null = null;
    if (row.priceOverridePerKg != null && row.priceOverridePerKg !== "") {
      const parsedOverride = Number(row.priceOverridePerKg);

      if (!Number.isFinite(parsedOverride) || parsedOverride <= 0) {
        return {
          ok: false,
          message:
            "Each item priceOverridePerKg must be a positive number when provided.",
        };
      }

      if (!hasUpToThreeDecimals(parsedOverride)) {
        return {
          ok: false,
          message: "Each item priceOverridePerKg must have up to 3 decimals.",
        };
      }

      priceOverridePerKg = parsedOverride;
    }

    items.push({ amount, unit: unitRaw, ingredientId, priceOverridePerKg });
    totalGrams +=
      unitRaw === "kg"
        ? amount * 1000
        : unitRaw === "g"
          ? amount
          : unitRaw === "%w/w"
            ? amount
            : 0;
  }

  if (totalGrams > 100000) {
    return {
      ok: false,
      message: "Total grams must not exceed 100000 g (100 kg batch).",
    };
  }

  return {
    ok: true,
    data: {
      name,
      category,
      targetBrix,
      targetPH,
      co2GPerL,
      desiredBrix,
      temperatureC,
      notes: notesText || null,
      items,
    },
  };
}
