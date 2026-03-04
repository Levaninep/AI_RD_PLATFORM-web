import * as XLSX from "xlsx";
import {
  ingredientCreateSchema,
  normalizeBoolean,
  normalizeCategory,
  normalizeDate,
} from "@/lib/ingredient";

export const INGREDIENT_SHEET_NAME = "Ingredients_Database";

export const INGREDIENT_IMPORT_COLUMNS = [
  "Ingredient Name",
  "Category (Sweetener/Juice/Acid/Flavor/Extract/Other)",
  "Supplier",
  "Country of Origin",
  "Price per kg (EUR)",
  "Density (kg/L)",
  "Brix (%)",
  "Single Strength Brix (%)",
  "Titratable Acidity (%)",
  "pH",
  "CO2 Solubility Relevant (Yes/No)",
  "Water Content (%)",
  "Shelf-life (months)",
  "Storage Conditions",
  "Allergen Info",
  "Vegan (Yes/No)",
  "Natural (Yes/No)",
  "Notes",
  "Created At",
  "Updated At",
] as const;

export type NormalizedIngredientImportRow = {
  ingredientName: string;
  category: "Sweetener" | "Juice" | "Acid" | "Flavor" | "Extract" | "Other";
  supplier: string;
  countryOfOrigin: string;
  pricePerKgEur: number;
  densityKgPerL?: number;
  brixPercent?: number;
  singleStrengthBrix?: number;
  titratableAcidityPercent?: number;
  pH?: number;
  co2SolubilityRelevant: boolean;
  waterContentPercent?: number;
  shelfLifeMonths?: number;
  storageConditions?: string;
  allergenInfo?: string;
  vegan: boolean;
  natural: boolean;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function normalizeNumber(raw: unknown): number | undefined {
  if (raw == null || raw === "") {
    return undefined;
  }

  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : undefined;
  }

  if (typeof raw === "string") {
    const parsed = Number(raw.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeString(raw: unknown): string {
  if (raw == null) {
    return "";
  }

  return String(raw).trim();
}

function firstNonNullValue(
  row: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    if (key in row && row[key] !== "" && row[key] != null) {
      return row[key];
    }
  }

  return undefined;
}

export function parseIngredientWorkbook(fileBuffer: Buffer): {
  rows: NormalizedIngredientImportRow[];
  warnings: string[];
  skippedCount: number;
} {
  const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });
  const sheet =
    workbook.Sheets[INGREDIENT_SHEET_NAME] ??
    workbook.Sheets[workbook.SheetNames[0]];

  if (!sheet) {
    return {
      rows: [],
      warnings: ["No worksheet found in uploaded file."],
      skippedCount: 0,
    };
  }

  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  const warnings: string[] = [];
  const rows: NormalizedIngredientImportRow[] = [];
  let skippedCount = 0;

  for (const [index, raw] of jsonRows.entries()) {
    const rowNumber = index + 2;

    const ingredientName = normalizeString(raw["Ingredient Name"]);
    const supplier = normalizeString(raw["Supplier"]);
    const countryOfOrigin = normalizeString(raw["Country of Origin"]);
    const pricePerKgEur = normalizeNumber(raw["Price per kg (EUR)"]);

    if (
      !ingredientName ||
      !supplier ||
      !countryOfOrigin ||
      pricePerKgEur == null
    ) {
      skippedCount += 1;
      warnings.push(
        `Row ${rowNumber}: skipped because required fields are missing (Ingredient Name, Supplier, Country of Origin, Price per kg (EUR)).`,
      );
      continue;
    }

    const normalized: NormalizedIngredientImportRow = {
      ingredientName,
      category: normalizeCategory(
        raw["Category (Sweetener/Juice/Acid/Flavor/Extract/Other)"],
      ),
      supplier,
      countryOfOrigin,
      pricePerKgEur,
      densityKgPerL: normalizeNumber(raw["Density (kg/L)"]),
      brixPercent: normalizeNumber(raw["Brix (%)"]),
      singleStrengthBrix: normalizeNumber(
        firstNonNullValue(raw, [
          "Single Strength Brix (%)",
          "Single Strength Brix",
          "Single-Strength Brix (%)",
          "Single-Strength Brix",
          "Single Strenght Brix (%)",
          "Single Strenght Brix",
        ]),
      ),
      titratableAcidityPercent: normalizeNumber(raw["Titratable Acidity (%)"]),
      pH: normalizeNumber(raw["pH"]),
      co2SolubilityRelevant: normalizeBoolean(
        raw["CO2 Solubility Relevant (Yes/No)"],
      ),
      waterContentPercent: normalizeNumber(raw["Water Content (%)"]),
      shelfLifeMonths: normalizeNumber(raw["Shelf-life (months)"]),
      storageConditions:
        normalizeString(raw["Storage Conditions"]) || undefined,
      allergenInfo: normalizeString(raw["Allergen Info"]) || undefined,
      vegan: normalizeBoolean(raw["Vegan (Yes/No)"]),
      natural: normalizeBoolean(raw["Natural (Yes/No)"]),
      notes: normalizeString(raw["Notes"]) || undefined,
      createdAt: normalizeDate(raw["Created At"]),
      updatedAt: normalizeDate(raw["Updated At"]),
    };

    if (normalized.pricePerKgEur < 0) {
      warnings.push(`Row ${rowNumber}: pricePerKgEur is below 0.`);
    }

    if (normalized.densityKgPerL != null && normalized.densityKgPerL <= 0) {
      warnings.push(`Row ${rowNumber}: densityKgPerL must be > 0.`);
    }

    if (
      normalized.brixPercent != null &&
      (normalized.brixPercent < 0 || normalized.brixPercent > 100)
    ) {
      warnings.push(`Row ${rowNumber}: brixPercent is outside 0-100.`);
    }

    if (
      normalized.singleStrengthBrix != null &&
      (normalized.singleStrengthBrix < 0 || normalized.singleStrengthBrix > 100)
    ) {
      warnings.push(`Row ${rowNumber}: singleStrengthBrix is outside 0-100.`);
    }

    if (
      normalized.titratableAcidityPercent != null &&
      (normalized.titratableAcidityPercent < 0 ||
        normalized.titratableAcidityPercent > 100)
    ) {
      warnings.push(
        `Row ${rowNumber}: titratableAcidityPercent is outside 0-100.`,
      );
    }

    if (normalized.pH != null && (normalized.pH < 0 || normalized.pH > 14)) {
      warnings.push(`Row ${rowNumber}: pH is outside 0-14.`);
    }

    if (
      normalized.waterContentPercent != null &&
      (normalized.waterContentPercent < 0 ||
        normalized.waterContentPercent > 100)
    ) {
      warnings.push(`Row ${rowNumber}: waterContentPercent is outside 0-100.`);
    }

    if (normalized.shelfLifeMonths != null && normalized.shelfLifeMonths < 0) {
      warnings.push(`Row ${rowNumber}: shelfLifeMonths is below 0.`);
    }

    const parsed = ingredientCreateSchema.safeParse(normalized);
    if (!parsed.success) {
      skippedCount += 1;
      warnings.push(
        `Row ${rowNumber}: skipped because ${parsed.error.issues[0]?.message ?? "validation failed"}.`,
      );
      continue;
    }

    rows.push(parsed.data);
  }

  return { rows, warnings, skippedCount };
}
