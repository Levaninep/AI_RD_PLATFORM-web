import { z } from "zod";

export const INGREDIENT_CATEGORIES = [
  "Sweetener",
  "Juice",
  "Acid",
  "Flavor",
  "Extract",
  "Other",
] as const;

export type IngredientCategoryLabel = (typeof INGREDIENT_CATEGORIES)[number];
export type IngredientSortBy = "price" | "brix" | "updatedAt";

const ingredientCategorySchema = z.enum(INGREDIENT_CATEGORIES);

function optionalNumber(
  input: unknown,
  min?: number,
  max?: number,
): number | undefined {
  if (input === "" || input == null) {
    return undefined;
  }

  const normalized =
    typeof input === "string"
      ? Number(input.trim().replace(",", "."))
      : Number(input);

  if (!Number.isFinite(normalized)) {
    return undefined;
  }

  if (min != null && normalized < min) {
    return undefined;
  }

  if (max != null && normalized > max) {
    return undefined;
  }

  return normalized;
}

const optionalNumeric = (validator: z.ZodNumber) =>
  z.preprocess((value) => {
    if (value === "" || value == null) {
      return undefined;
    }

    if (typeof value === "string") {
      const parsed = Number(value.trim().replace(",", "."));
      return Number.isFinite(parsed) ? parsed : value;
    }

    return value;
  }, validator.optional());

const boolFromMixed = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (["yes", "true", "1"].includes(normalized)) {
    return true;
  }

  return false;
}, z.boolean().default(false));

export const ingredientCreateSchema = z.object({
  ingredientName: z
    .string()
    .trim()
    .min(2, "Ingredient name must be at least 2 characters."),
  category: ingredientCategorySchema.default("Other"),
  supplier: z.string().trim().min(1, "Supplier is required."),
  countryOfOrigin: z.string().trim().min(1, "Country of origin is required."),
  pricePerKgEur: z.coerce.number().min(0, "Price per kg (EUR) must be >= 0."),
  densityKgPerL: optionalNumeric(z.number().gt(0, "Density must be > 0.")),
  brixPercent: optionalNumeric(
    z
      .number()
      .min(0, "Brix must be between 0 and 100.")
      .max(100, "Brix must be between 0 and 100."),
  ),
  singleStrengthBrix: optionalNumeric(
    z
      .number()
      .min(0, "Single-strength Brix must be between 0 and 100.")
      .max(100, "Single-strength Brix must be between 0 and 100."),
  ),
  brixDensityTempC: z.coerce
    .number()
    .min(-20, "Reference temperature must be >= -20.")
    .max(120, "Reference temperature must be <= 120.")
    .optional(),
  titratableAcidityPercent: optionalNumeric(
    z
      .number()
      .min(0, "Titratable acidity must be between 0 and 100.")
      .max(100, "Titratable acidity must be between 0 and 100."),
  ),
  pH: optionalNumeric(
    z
      .number()
      .min(0, "pH must be between 0 and 14.")
      .max(14, "pH must be between 0 and 14."),
  ),
  co2SolubilityRelevant: boolFromMixed,
  waterContentPercent: optionalNumeric(
    z
      .number()
      .min(0, "Water content must be between 0 and 100.")
      .max(100, "Water content must be between 0 and 100."),
  ),
  energyKcal: optionalNumeric(
    z.number().min(0, "Energy (kcal) must be >= 0.").max(1000),
  ),
  energyKj: optionalNumeric(
    z.number().min(0, "Energy (kJ) must be >= 0.").max(5000),
  ),
  fat: optionalNumeric(
    z.number().min(0, "Fat must be between 0 and 100.").max(100),
  ),
  saturates: optionalNumeric(
    z.number().min(0, "Saturates must be between 0 and 100.").max(100),
  ),
  carbohydrates: optionalNumeric(
    z.number().min(0, "Carbohydrates must be between 0 and 100.").max(100),
  ),
  sugars: optionalNumeric(
    z.number().min(0, "Sugars must be between 0 and 100.").max(100),
  ),
  protein: optionalNumeric(
    z.number().min(0, "Protein must be between 0 and 100.").max(100),
  ),
  salt: optionalNumeric(
    z.number().min(0, "Salt must be between 0 and 100.").max(100),
  ),
  nutritionBasis: z.enum(["PER_100G", "PER_100ML"]).optional(),
  shelfLifeMonths: z
    .preprocess(
      (value) => optionalNumber(value, 0),
      z.number().int().min(0).optional(),
    )
    .optional(),
  storageConditions: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  allergenInfo: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  vegan: boolFromMixed,
  natural: boolFromMixed,
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  coaFileUrl: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const ingredientUpdateSchema = ingredientCreateSchema.partial().extend({
  id: z.string().uuid().optional(),
});

export const ingredientQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
  category: ingredientCategorySchema.optional(),
  vegan: z.enum(["true", "false", "all"]).optional().default("all"),
  natural: z.enum(["true", "false", "all"]).optional().default("all"),
  co2Relevant: z.enum(["true", "false", "all"]).optional().default("all"),
  sortBy: z
    .enum(["price", "brix", "updatedAt"])
    .optional()
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  includeEffective: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((value) => value === "true"),
  scopeType: z.enum(["global", "project", "formulation"]).optional(),
  scopeId: z.string().trim().optional(),
  projectId: z.string().trim().optional(),
  formulationId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type IngredientCreateInput = z.infer<typeof ingredientCreateSchema>;
export type IngredientUpdateInput = z.infer<typeof ingredientUpdateSchema>;
export type IngredientQueryInput = z.infer<typeof ingredientQuerySchema>;

export function normalizeCategory(raw: unknown): IngredientCategoryLabel {
  if (typeof raw !== "string") {
    return "Other";
  }

  const normalized = raw.trim().toLowerCase();

  if (normalized === "sweetener") return "Sweetener";
  if (normalized === "juice" || normalized === "juice concentrate")
    return "Juice";
  if (normalized === "acid") return "Acid";
  if (normalized === "flavor") return "Flavor";
  if (normalized === "extract") return "Extract";

  return "Other";
}

export function normalizeBoolean(raw: unknown): boolean {
  if (typeof raw === "boolean") {
    return raw;
  }

  if (typeof raw !== "string") {
    return false;
  }

  return ["yes", "true", "1"].includes(raw.trim().toLowerCase());
}

export function normalizeDate(raw: unknown): Date | undefined {
  if (!raw) {
    return undefined;
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw;
  }

  if (typeof raw === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + raw * 86400000);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  if (typeof raw === "string") {
    const parsed = new Date(raw.trim());
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
}

export function toPrismaIngredientCategory(
  label: IngredientCategoryLabel,
): "Sweetener" | "Juice" | "Acid" | "Flavor" | "Extract" | "Other" {
  return label;
}

export function fromPrismaIngredientCategory(
  value: "Sweetener" | "Juice" | "Acid" | "Flavor" | "Extract" | "Other",
): IngredientCategoryLabel {
  return value;
}
