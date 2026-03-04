import { z } from "zod";
import { INGREDIENT_CATEGORIES } from "@/lib/ingredient";

const categorySchema = z.enum(INGREDIENT_CATEGORIES);

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

export const adminIngredientInputSchema = z.object({
  ingredientName: z
    .string()
    .trim()
    .min(2, "Ingredient name must be at least 2 characters."),
  category: categorySchema,
  supplier: z.string().trim().min(1, "Supplier is required."),
  countryOfOrigin: z.string().trim().min(1, "Country of origin is required."),
  pricePerKgEur: z.coerce.number().min(0, "Price per kg must be >= 0."),
  densityKgPerL: optionalNumeric(
    z.number().min(0.98, "Density must be between 0.98 and 1.45.").max(1.45),
  ),
  brixPercent: optionalNumeric(
    z.number().min(0, "Brix must be between 0 and 85.").max(85),
  ),
  singleStrengthBrix: optionalNumeric(
    z.number().min(0, "Single-strength Brix must be between 0 and 85.").max(85),
  ),
  titratableAcidityPercent: optionalNumeric(
    z.number().min(0, "Titratable acidity must be between 0 and 100.").max(100),
  ),
  pH: optionalNumeric(
    z.number().min(0, "pH must be between 0 and 14.").max(14),
  ),
  waterContentPercent: optionalNumeric(
    z.number().min(0, "Water content must be between 0 and 100.").max(100),
  ),
  shelfLifeMonths: z.preprocess((value) => {
    if (value === "" || value == null) {
      return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }, z.number().int().min(0, "Shelf life must be >= 0.").optional()),
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
  vegan: z.boolean().optional().default(false),
  natural: z.boolean().optional().default(false),
  co2SolubilityRelevant: z.boolean().optional().default(false),
  notes: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
});

export const adminIngredientUpdateSchema = adminIngredientInputSchema.partial();

export const adminIngredientSortBySchema = z.enum([
  "updatedAt",
  "name",
  "price",
  "brix",
]);

export type AdminIngredientSortBy = z.infer<typeof adminIngredientSortBySchema>;

export const adminIngredientQuerySchema = z.object({
  q: z.string().trim().optional().default(""),
  category: categorySchema.optional(),
  vegan: z.enum(["all", "true", "false"]).optional().default("all"),
  natural: z.enum(["all", "true", "false"]).optional().default("all"),
  co2Relevant: z.enum(["all", "true", "false"]).optional().default("all"),
  sortBy: adminIngredientSortBySchema.optional().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce
    .number()
    .int()
    .refine((value) => [20, 50].includes(value), {
      message: "Limit must be 20 or 50.",
    }),
});

export function toDeleteBlockedMessage(formulationsCount: number): string {
  if (formulationsCount === 1) {
    return "Ingredient is used in 1 formulation. Remove from formulations first.";
  }

  return `Ingredient is used in ${formulationsCount} formulations. Remove from formulations first.`;
}
