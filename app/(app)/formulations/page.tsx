"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  ApiErrorResponse,
  CreateFormulationPayload,
  Formulation,
  Ingredient,
} from "@/lib/types";
import {
  applyBrixTemperatureCorrection,
  brixToDensityGPerML,
} from "@/lib/brix";
import {
  getEffectivePricePerKg,
  isWaterIngredientName,
  resolveBasePricePerKg as resolveIngredientBasePricePerKg,
} from "@/lib/formulation";
import { calculateFormulationMetrics } from "@/lib/formulation/calc";
import { applyAutoSync } from "@/lib/physchem/autoSync";
import {
  calcSpecs,
  toMassKg,
  type IngredientRef,
  type Line,
} from "@/src/lib/formulation/calcSpecs";

const FORMULATION_CATEGORIES = [
  "Juice",
  "Carbonated soft drink",
  "Ice Tea",
] as const;

type FormulationCategory = (typeof FORMULATION_CATEGORIES)[number];

type BuilderRow = {
  id: string;
  dosageGrams: string;
  unit: "kg" | "g" | "L" | "mL" | "ml" | "%w/w";
  ingredientId: string;
  basePricePerKg: number | null;
  overridePricePerKg: string;
  useOverride: boolean;
  search: string;
  options: Ingredient[];
  searching: boolean;
  open: boolean;
  highlightedIndex: number;
};

type SpecOverrideDraft = {
  open: boolean;
  autoCalculate: boolean;
  overridePricePerKgEur: string;
  overrideDensityKgPerL: string;
  overrideBrixPercent: string;
  overrideTitratableAcidityPercent: string;
  overrideId: string | null;
};

type FormState = {
  name: string;
  category: FormulationCategory | "";
  finalVolumeL: string;
  batchSizeUnit: "kg" | "L";
  targetAcidity: string;
  targetDensity: string;
  densityOverrideEnabled: boolean;
  desiredBrix: string;
  temperatureC: string;
  targetBrix: string;
  targetPH: string;
  co2GPerL: string;
  notes: string;
  items: BuilderRow[];
};

type FieldErrorMap = {
  name?: string;
  category?: string;
  desiredBrix?: string;
  temperatureC?: string;
  targetBrix?: string;
  targetPH?: string;
  co2GPerL?: string;
  finalVolumeL?: string;
  targetAcidity?: string;
  targetDensity?: string;
  items?: string;
  totalGrams?: string;
  rowErrors: Record<string, Partial<Record<string, string>>>;
};

const lineUnitSchema = z.enum(["kg", "g", "L", "mL", "ml", "%w/w"]);

const editorValidationSchema = z
  .object({
    finalVolumeL: z
      .string()
      .min(1, "Final volume (L) is required.")
      .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
        message: "Final volume (L) must be greater than 0.",
      }),
    targetBrix: z
      .string()
      .min(1, "Target Brix is required.")
      .refine((value) => Number.isFinite(Number(value)), {
        message: "Target Brix must be a valid number.",
      }),
    targetAcidity: z
      .string()
      .optional()
      .refine(
        (value) =>
          value == null ||
          value.trim() === "" ||
          Number.isFinite(Number(value.replace(",", "."))),
        {
          message: "Titratable acidity (%) must be a valid number.",
        },
      ),
    targetDensity: z
      .string()
      .optional()
      .refine(
        (value) =>
          value == null ||
          value.trim() === "" ||
          (Number.isFinite(Number(value.replace(",", "."))) &&
            Number(value.replace(",", ".")) > 0),
        {
          message: "Density must be greater than 0.",
        },
      ),
    densityOverrideEnabled: z.boolean(),
    items: z.array(
      z.object({
        amount: z
          .string()
          .min(1, "Amount is required.")
          .refine(
            (value) =>
              Number.isFinite(Number(value.replace(",", "."))) &&
              Number(value.replace(",", ".")) > 0,
            {
              message: "Amount must be greater than 0.",
            },
          ),
        unit: lineUnitSchema,
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (
      data.densityOverrideEnabled &&
      (!data.targetDensity || !data.targetDensity.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Density override must be provided.",
        path: ["targetDensity"],
      });
    }
  });

type EditorValidationValues = z.infer<typeof editorValidationSchema>;

function createRowId(): string {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createExistingRow(): BuilderRow {
  return {
    id: createRowId(),
    dosageGrams: "",
    unit: "g",
    ingredientId: "",
    basePricePerKg: null,
    overridePricePerKg: "",
    useOverride: false,
    search: "",
    options: [],
    searching: false,
    open: false,
    highlightedIndex: -1,
  };
}

function orderRowsWithWaterLast(
  items: BuilderRow[],
  waterIngredientId: string | null,
): BuilderRow[] {
  if (!waterIngredientId) {
    return items;
  }

  const nonWaterRows = items.filter(
    (row) => row.ingredientId !== waterIngredientId,
  );
  const waterRows = items.filter(
    (row) => row.ingredientId === waterIngredientId,
  );

  return waterRows.length > 0 ? [...nonWaterRows, ...waterRows] : items;
}

function toOptionalNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseNumber(value: string): number {
  return Number(value.trim().replace(",", "."));
}

function massKgToGrams(value: number): number {
  return value * 1000;
}

function acidKgToTitratableAcidityPercent(value: number): number {
  return value * 100;
}

function acidKgPerMassKgToPercent(
  acidKg: number,
  massKg: number,
): number | null {
  if (!Number.isFinite(acidKg) || !Number.isFinite(massKg) || massKg <= 0) {
    return null;
  }

  return (acidKg / massKg) * 100;
}

function massToKgForBatch(value: number, unit: string): number {
  if (unit === "g") {
    return value / 1000;
  }

  if (unit === "kg") {
    return value;
  }

  return value;
}

function batchDisplayUnit(unit: string): string {
  if (unit === "g" || unit === "kg") {
    return "kg";
  }

  return unit;
}

function savedLineAmountToLiters(input: {
  amount: number;
  unit: string;
  densityKgPerL: number | null;
}): number {
  const density =
    input.densityKgPerL != null &&
    Number.isFinite(input.densityKgPerL) &&
    input.densityKgPerL > 0
      ? input.densityKgPerL
      : 1;

  if (input.unit === "L") {
    return input.amount;
  }

  if (input.unit === "mL" || input.unit === "ml") {
    return input.amount / 1000;
  }

  if (input.unit === "kg") {
    return input.amount / density;
  }

  if (input.unit === "g") {
    return input.amount / 1000 / density;
  }

  return 0;
}

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error occurred.";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(value);
}

function formatPricePerKg(value: number): string {
  if (value > 0 && value < 0.01) {
    return value.toFixed(5);
  }

  const roundedTo2 = Math.round(value * 100) / 100;
  const needsThreeDecimals = Math.abs(roundedTo2 - value) > 1e-9;
  return value.toFixed(needsThreeDecimals ? 3 : 2);
}

function hasUpToThreeDecimals(raw: string): boolean {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) {
    return false;
  }
  const [, fraction = ""] = normalized.split(".");
  return fraction.length <= 3;
}

function resolveBasePricePerKg(
  row: BuilderRow,
  ingredientById: Map<string, Ingredient>,
): number | null {
  if (
    row.basePricePerKg != null &&
    Number.isFinite(row.basePricePerKg) &&
    row.basePricePerKg > 0
  ) {
    return row.basePricePerKg;
  }

  const ingredient = ingredientById.get(row.ingredientId);

  return resolveIngredientBasePricePerKg({
    ingredientName: ingredient?.ingredientName,
    name: ingredient?.name,
    pricePerKgEur:
      ingredient?.effectivePricePerKgEur ?? ingredient?.pricePerKgEur,
    pricePerKg: ingredient?.pricePerKg,
  });
}

function parseOverridePrice(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function isFormulationCategory(value: string): value is FormulationCategory {
  return FORMULATION_CATEGORIES.includes(value as FormulationCategory);
}

function validateForm(
  state: FormState,
  ingredientById: Map<string, Ingredient>,
): FieldErrorMap {
  const errors: FieldErrorMap = { rowErrors: {} };

  const finalVolumeL = toOptionalNumber(state.finalVolumeL);
  if (finalVolumeL === null) {
    errors.finalVolumeL = "Final volume (L) is required.";
  } else if (!Number.isFinite(finalVolumeL) || finalVolumeL <= 0) {
    errors.finalVolumeL = "Final volume (L) must be greater than 0.";
  }

  const targetAcidity = toOptionalNumber(state.targetAcidity);
  if (targetAcidity !== null && !Number.isFinite(targetAcidity)) {
    errors.targetAcidity = "Titratable acidity (%) must be a valid number.";
  }

  const targetDensity = toOptionalNumber(state.targetDensity);
  if (state.densityOverrideEnabled) {
    if (targetDensity === null) {
      errors.targetDensity = "Density override must be provided.";
    } else if (!Number.isFinite(targetDensity) || targetDensity <= 0) {
      errors.targetDensity = "Density must be greater than 0.";
    }
  }

  if (state.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (state.category === "") {
    errors.category = "Category is required.";
  }

  const desiredBrix = toOptionalNumber(state.desiredBrix);
  if (desiredBrix !== null && !Number.isFinite(desiredBrix)) {
    errors.desiredBrix = "Desired Brix must be a valid number.";
  }

  const temperatureC = toOptionalNumber(state.temperatureC);
  if (temperatureC !== null && !Number.isFinite(temperatureC)) {
    errors.temperatureC = "Temperature must be a valid number.";
  }

  const targetBrix = toOptionalNumber(state.targetBrix);
  if (targetBrix !== null && !Number.isFinite(targetBrix)) {
    errors.targetBrix = "Target Brix must be a valid number.";
  }

  const targetPH = toOptionalNumber(state.targetPH);
  if (targetPH !== null && !Number.isFinite(targetPH)) {
    errors.targetPH = "Target pH must be a valid number.";
  }

  const isCarbonated = state.category === "Carbonated soft drink";
  const co2GPerL = toOptionalNumber(state.co2GPerL);
  if (isCarbonated) {
    if (co2GPerL === null) {
      errors.co2GPerL = "CO₂ (g/L) is required for Carbonated soft drink.";
    } else if (!Number.isFinite(co2GPerL)) {
      errors.co2GPerL = "CO₂ (g/L) must be a valid number.";
    } else if (co2GPerL < 2 || co2GPerL > 9) {
      errors.co2GPerL = "CO₂ (g/L) must be between 2.0 and 9.0.";
    }
  }

  if (state.items.length === 0) {
    errors.items = "At least one ingredient row is required.";
  }

  let totalGrams = 0;

  for (const row of state.items) {
    const rowError: Partial<Record<string, string>> = {};
    const dosageGrams = parseNumber(row.dosageGrams);

    if (!Number.isFinite(dosageGrams) || dosageGrams <= 0) {
      rowError.dosageGrams = "Dosage (g) must be greater than 0.";
    } else {
      totalGrams += dosageGrams;
    }

    if (!row.ingredientId) {
      rowError.ingredientId = "Select an existing ingredient.";
    }

    const basePricePerKg = resolveBasePricePerKg(row, ingredientById);
    const hasBasePrice =
      basePricePerKg != null &&
      Number.isFinite(basePricePerKg) &&
      basePricePerKg > 0;

    if (row.useOverride) {
      const overrideValue = parseOverridePrice(row.overridePricePerKg);
      if (overrideValue === null) {
        rowError.overridePricePerKg = "Enter custom price per kg.";
      } else if (!Number.isFinite(overrideValue) || overrideValue <= 0) {
        rowError.overridePricePerKg =
          "Custom price per kg must be a positive number.";
      } else if (!hasUpToThreeDecimals(row.overridePricePerKg)) {
        rowError.overridePricePerKg =
          "Custom price per kg must have up to 3 decimals.";
      }
    } else if (!hasBasePrice && row.ingredientId) {
      rowError.overridePricePerKg =
        "Base price is missing. Enable custom price to continue.";
    }

    if (Object.keys(rowError).length > 0) {
      errors.rowErrors[row.id] = rowError;
    }
  }

  if (totalGrams > 100000) {
    errors.totalGrams = "Total grams must not exceed 100000 g (100 kg batch).";
  }

  return errors;
}

function hasValidationErrors(errors: FieldErrorMap): boolean {
  return Boolean(
    errors.name ||
    errors.category ||
    errors.desiredBrix ||
    errors.temperatureC ||
    errors.targetBrix ||
    errors.targetPH ||
    errors.co2GPerL ||
    errors.finalVolumeL ||
    errors.targetAcidity ||
    errors.targetDensity ||
    errors.items ||
    errors.totalGrams ||
    Object.keys(errors.rowErrors).length > 0,
  );
}

export default function FormulationsPage() {
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [autosaving, setAutosaving] = useState(false);
  const [savedForBatch, setSavedForBatch] = useState<Formulation | null>(null);
  const [batchLiters, setBatchLiters] = useState("100");
  const [specOverrideDrafts, setSpecOverrideDrafts] = useState<
    Record<string, SpecOverrideDraft>
  >({});

  const [form, setForm] = useState<FormState>({
    name: "",
    category: "",
    finalVolumeL: "1",
    batchSizeUnit: "L",
    targetAcidity: "",
    targetDensity: "",
    densityOverrideEnabled: false,
    desiredBrix: "",
    temperatureC: "20",
    targetBrix: "",
    targetPH: "",
    co2GPerL: "",
    notes: "",
    items: [createExistingRow()],
  });
  const [ingredientCatalog, setIngredientCatalog] = useState<Ingredient[]>([]);

  const editorValidationValues = useMemo<EditorValidationValues>(
    () => ({
      finalVolumeL: form.finalVolumeL,
      targetBrix: form.targetBrix,
      targetAcidity: form.targetAcidity,
      targetDensity: form.targetDensity,
      densityOverrideEnabled: form.densityOverrideEnabled,
      items: form.items.map((row) => ({
        amount: row.dosageGrams,
        unit: row.unit,
      })),
    }),
    [
      form.finalVolumeL,
      form.targetBrix,
      form.targetAcidity,
      form.targetDensity,
      form.densityOverrideEnabled,
      form.items,
    ],
  );

  const editorForm = useForm<EditorValidationValues>({
    resolver: zodResolver(editorValidationSchema),
    mode: "onChange",
    defaultValues: editorValidationValues,
  });

  useEffect(() => {
    editorForm.reset(editorValidationValues);
    void editorForm.trigger();
  }, [editorValidationValues, editorForm]);

  const editorErrors = editorForm.formState.errors;

  const isSugarIngredient = useCallback((ingredient?: Ingredient | null) => {
    if (!ingredient) {
      return false;
    }

    const category = (ingredient.category ?? "").toLowerCase();
    const name = (
      ingredient.ingredientName ??
      ingredient.name ??
      ""
    ).toLowerCase();

    return (
      name.includes("sugar") ||
      name.includes("sucrose") ||
      name.includes("dextrose") ||
      name.includes("glucose") ||
      name.includes("fructose") ||
      category.includes("sugar") ||
      category.includes("sweet") ||
      category.includes("sweetener")
    );
  }, []);

  const isCitricIngredient = useCallback((ingredient?: Ingredient | null) => {
    if (!ingredient) {
      return false;
    }

    const category = (ingredient.category ?? "").toLowerCase();
    const name = (
      ingredient.ingredientName ??
      ingredient.name ??
      ""
    ).toLowerCase();

    return (
      name.includes("citric acid") ||
      (name.includes("citric") && category.includes("acid"))
    );
  }, []);

  const ingredientById = useMemo(() => {
    return new Map(ingredientCatalog.map((item) => [item.id, item] as const));
  }, [ingredientCatalog]);

  const applyDraftOverrides = useCallback(
    (
      ingredient: Ingredient | undefined,
      ingredientId: string,
    ): Ingredient | undefined => {
      if (!ingredient) {
        return ingredient;
      }

      const draft = specOverrideDrafts[ingredientId];
      if (!draft) {
        return ingredient;
      }

      const parseField = (value: string): number | null => {
        const normalized = value.trim().replace(",", ".");
        if (!normalized) {
          return null;
        }
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : null;
      };

      const price = parseField(draft.overridePricePerKgEur);
      const density = parseField(draft.overrideDensityKgPerL);
      const brix = parseField(draft.overrideBrixPercent);
      const acidity = parseField(draft.overrideTitratableAcidityPercent);

      return {
        ...ingredient,
        effectivePricePerKgEur: price ?? ingredient.effectivePricePerKgEur,
        effectiveDensityKgPerL: density ?? ingredient.effectiveDensityKgPerL,
        effectiveBrixPercent: brix ?? ingredient.effectiveBrixPercent,
        effectiveTitratableAcidityPercent:
          acidity ?? ingredient.effectiveTitratableAcidityPercent,
      };
    },
    [specOverrideDrafts],
  );

  const validation = useMemo(
    () => validateForm(form, ingredientById),
    [form, ingredientById],
  );
  const isValid = useMemo(() => !hasValidationErrors(validation), [validation]);

  const waterIngredientId = useMemo(() => {
    const water = ingredientCatalog.find(
      (item) =>
        (item.ingredientName ?? item.name ?? "").trim().toLowerCase() ===
        "water",
    );
    return water?.id ?? null;
  }, [ingredientCatalog]);

  const suggestedSugarIngredient = useMemo(() => {
    const byMatcher = ingredientCatalog.find((item) => isSugarIngredient(item));
    if (byMatcher) {
      return byMatcher;
    }

    return ingredientCatalog.find((item) => {
      const name = (item.ingredientName ?? item.name ?? "").toLowerCase();
      return (
        name.includes("sugar") ||
        name.includes("sucrose") ||
        name.includes("dextrose") ||
        name.includes("glucose") ||
        name.includes("fructose")
      );
    });
  }, [ingredientCatalog, isSugarIngredient]);

  const suggestedCitricIngredient = useMemo(() => {
    const byMatcher = ingredientCatalog.find((item) =>
      isCitricIngredient(item),
    );
    if (byMatcher) {
      return byMatcher;
    }

    return ingredientCatalog.find((item) => {
      const name = (item.ingredientName ?? item.name ?? "").toLowerCase();
      return name.includes("citric");
    });
  }, [ingredientCatalog, isCitricIngredient]);

  const calcLines = useMemo<Line[]>(() => {
    return form.items
      .filter(
        (row) =>
          Boolean(row.ingredientId) &&
          row.ingredientId !== waterIngredientId &&
          row.unit !== "%w/w",
      )
      .map((row) => {
        const ingredient = applyDraftOverrides(
          ingredientById.get(row.ingredientId),
          row.ingredientId,
        );
        const amount = parseNumber(row.dosageGrams);

        const unit: Line["unit"] =
          row.unit === "ml" ? "mL" : row.unit === "%w/w" ? "g" : row.unit;

        return {
          ingredient: {
            id: ingredient?.id ?? row.ingredientId,
            name:
              ingredient?.ingredientName ??
              ingredient?.name ??
              row.search ??
              "Unknown",
            category: ingredient?.category ?? "Other",
            density:
              ingredient?.effectiveDensityKgPerL ??
              ingredient?.densityKgPerL ??
              ingredient?.density ??
              null,
            brix:
              ingredient?.effectiveBrixPercent ??
              ingredient?.brixPercent ??
              ingredient?.brix ??
              null,
            titratableAcidity:
              ingredient?.effectiveTitratableAcidityPercent ??
              ingredient?.titratableAcidityPercent ??
              ingredient?.titratableAcidity ??
              null,
          } satisfies IngredientRef,
          amount: Number.isFinite(amount) ? amount : 0,
          unit,
        };
      });
  }, [form.items, ingredientById, waterIngredientId, applyDraftOverrides]);

  const targetBrixValue = toOptionalNumber(form.targetBrix);
  const targetAcidityValue = toOptionalNumber(form.targetAcidity);
  const targetDensityValue = toOptionalNumber(form.targetDensity);

  const specsCalc = useMemo(() => {
    if (targetBrixValue == null || !Number.isFinite(targetBrixValue)) {
      return null;
    }

    return calcSpecs(calcLines, {
      finalVolumeL: 1,
      targetBrix: targetBrixValue,
      targetAcidity:
        targetAcidityValue != null && Number.isFinite(targetAcidityValue)
          ? targetAcidityValue / 100
          : null,
      densityKgPerL:
        form.densityOverrideEnabled &&
        targetDensityValue != null &&
        Number.isFinite(targetDensityValue)
          ? targetDensityValue
          : null,
    });
  }, [
    calcLines,
    targetBrixValue,
    targetAcidityValue,
    targetDensityValue,
    form.densityOverrideEnabled,
  ]);

  const lineContributions = useMemo(() => {
    const map = new Map<
      string,
      {
        massKg: number;
        solidsKg: number;
        acidKg: number;
        densityKgPerL: number;
      }
    >();

    for (const row of form.items) {
      const ingredient = applyDraftOverrides(
        ingredientById.get(row.ingredientId),
        row.ingredientId,
      );
      if (!ingredient) {
        map.set(row.id, {
          massKg: 0,
          solidsKg: 0,
          acidKg: 0,
          densityKgPerL: 1,
        });
        continue;
      }

      const amount = parseNumber(row.dosageGrams);
      const unit: Line["unit"] =
        row.unit === "ml" ? "mL" : row.unit === "%w/w" ? "g" : row.unit;

      const line: Line = {
        ingredient: {
          id: ingredient.id,
          name: ingredient.ingredientName ?? ingredient.name ?? "",
          category: ingredient.category,
          density:
            ingredient.effectiveDensityKgPerL ??
            ingredient.densityKgPerL ??
            ingredient.density ??
            null,
          brix:
            ingredient.effectiveBrixPercent ??
            ingredient.brixPercent ??
            ingredient.brix ??
            null,
          titratableAcidity:
            ingredient.effectiveTitratableAcidityPercent ??
            ingredient.titratableAcidityPercent ??
            ingredient.titratableAcidity ??
            null,
        },
        amount: Number.isFinite(amount) ? amount : 0,
        unit,
      };

      const massKg = toMassKg(line);

      let solidsKg = 0;
      if (
        ingredient.category.toLowerCase().includes("juice") &&
        (ingredient.effectiveBrixPercent ??
          ingredient.brixPercent ??
          ingredient.brix) != null
      ) {
        solidsKg =
          massKg *
          ((ingredient.effectiveBrixPercent ??
            ingredient.brixPercent ??
            ingredient.brix ??
            0) /
            100);
      } else if (isSugarIngredient(ingredient)) {
        solidsKg = massKg;
      }

      let acidKg = 0;
      if (
        ingredient.category.toLowerCase().includes("juice") &&
        (ingredient.effectiveTitratableAcidityPercent ??
          ingredient.titratableAcidityPercent ??
          ingredient.titratableAcidity) != null
      ) {
        acidKg =
          massKg *
          ((ingredient.effectiveTitratableAcidityPercent ??
            ingredient.titratableAcidityPercent ??
            ingredient.titratableAcidity ??
            0) /
            100);
      } else if (isCitricIngredient(ingredient)) {
        acidKg = massKg;
      }

      map.set(row.id, {
        massKg,
        solidsKg,
        acidKg,
        densityKgPerL:
          ingredient.effectiveDensityKgPerL ??
          ingredient.densityKgPerL ??
          ingredient.density ??
          1,
      });
    }

    return map;
  }, [
    form.items,
    ingredientById,
    isSugarIngredient,
    isCitricIngredient,
    applyDraftOverrides,
  ]);

  const totalGrams = useMemo(() => {
    if (!specsCalc) {
      return 0;
    }

    return specsCalc.totals.sumMassKg * 1000;
  }, [specsCalc]);

  const advancedCalc = useMemo(() => {
    return calculateFormulationMetrics({
      batchSizeValue: 1,
      batchSizeUnit: "L",
      lines: form.items
        .filter((row) => Boolean(row.ingredientId))
        .map((row) => {
          const ingredient = applyDraftOverrides(
            ingredientById.get(row.ingredientId),
            row.ingredientId,
          );
          const dosageValue = parseNumber(row.dosageGrams);

          return {
            dosageValue: Number.isFinite(dosageValue) ? dosageValue : 0,
            dosageUnit: (row.unit === "mL" ? "ml" : row.unit) as
              | "g"
              | "kg"
              | "ml"
              | "L"
              | "%w/w",
            priceOverridePerKgEur:
              row.useOverride && row.overridePricePerKg.trim()
                ? parseNumber(row.overridePricePerKg)
                : null,
            ingredient: {
              id: ingredient?.id ?? row.ingredientId,
              ingredientName:
                ingredient?.ingredientName ??
                ingredient?.name ??
                row.search ??
                "Unknown",
              category: ingredient?.category ?? null,
              densityKgPerL:
                ingredient?.effectiveDensityKgPerL ??
                ingredient?.densityKgPerL ??
                ingredient?.density ??
                null,
              brixPercent:
                ingredient?.effectiveBrixPercent ??
                ingredient?.brixPercent ??
                ingredient?.brix ??
                null,
              singleStrengthBrix:
                ingredient?.effectiveSingleStrengthBrix ??
                ingredient?.singleStrengthBrix ??
                null,
              titratableAcidityPercent:
                ingredient?.effectiveTitratableAcidityPercent ??
                ingredient?.titratableAcidityPercent ??
                ingredient?.titratableAcidity ??
                null,
              pricePerKgEur: resolveIngredientBasePricePerKg({
                ingredientName: ingredient?.ingredientName,
                name: ingredient?.name,
                pricePerKgEur:
                  ingredient?.effectivePricePerKgEur ??
                  ingredient?.pricePerKgEur,
                pricePerKg: ingredient?.pricePerKg,
              }),
              co2SolubilityRelevant: ingredient?.co2SolubilityRelevant ?? false,
            },
          };
        }),
    });
  }, [form.items, ingredientById, applyDraftOverrides]);

  const batchLitersValue = useMemo(() => {
    const parsed = toOptionalNumber(batchLiters);
    if (parsed == null || !Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return parsed;
  }, [batchLiters]);

  const batchScaleRows = useMemo(() => {
    if (!savedForBatch || batchLitersValue == null) {
      return [] as Array<{
        id: string;
        ingredientName: string;
        unit: string;
        baseAmount: number;
        scaledAmount: number;
      }>;
    }

    return savedForBatch.ingredients.map((line) => {
      const baseAmount = Number(line.amount ?? line.dosageGrams ?? 0);
      const unit = line.unit ?? "g";
      const baseAmountForBatch = massToKgForBatch(baseAmount, unit);
      const scaledAmountForBatch = massToKgForBatch(
        baseAmount * batchLitersValue,
        unit,
      );
      return {
        id: line.id,
        ingredientName:
          line.ingredient.ingredientName ?? line.ingredient.name ?? "Unknown",
        unit: batchDisplayUnit(unit),
        baseAmount: baseAmountForBatch,
        scaledAmount: scaledAmountForBatch,
      };
    });
  }, [savedForBatch, batchLitersValue]);

  const batchSummary = useMemo(() => {
    if (!savedForBatch || batchLitersValue == null) {
      return {
        baseTotalCostEur: null as number | null,
        scaledTotalCostEur: null as number | null,
        baseWaterTopUpL: null as number | null,
        scaledWaterTopUpL: null as number | null,
      };
    }

    const calc = calculateFormulationMetrics({
      batchSizeValue: 1,
      batchSizeUnit: "L",
      lines: savedForBatch.ingredients.map((line) => {
        const amount = Number(line.amount ?? line.dosageGrams ?? 0);
        const unit = (line.unit ?? "g") as "g" | "kg" | "ml" | "L" | "%w/w";
        const name =
          line.ingredient.ingredientName ?? line.ingredient.name ?? "Unknown";

        return {
          dosageValue: Number.isFinite(amount) ? amount : 0,
          dosageUnit: unit,
          priceOverridePerKgEur:
            line.priceOverridePerKg != null &&
            Number.isFinite(line.priceOverridePerKg)
              ? line.priceOverridePerKg
              : null,
          ingredient: {
            id: line.ingredient.id,
            ingredientName: name,
            category: line.ingredient.category,
            densityKgPerL:
              line.ingredient.densityKgPerL ?? line.ingredient.density ?? null,
            brixPercent:
              line.ingredient.brixPercent ?? line.ingredient.brix ?? null,
            singleStrengthBrix: line.ingredient.singleStrengthBrix ?? null,
            titratableAcidityPercent:
              line.ingredient.titratableAcidityPercent ??
              line.ingredient.titratableAcidity ??
              null,
            pricePerKgEur: resolveIngredientBasePricePerKg({
              ingredientName: line.ingredient.ingredientName,
              name: line.ingredient.name,
              pricePerKgEur: line.ingredient.pricePerKgEur,
              pricePerKg: line.ingredient.pricePerKg,
            }),
            co2SolubilityRelevant: false,
          },
        };
      }),
    });

    const baseWaterTopUpL = savedForBatch.ingredients
      .filter((line) => {
        const name =
          line.ingredient.ingredientName ?? line.ingredient.name ?? "";
        return isWaterIngredientName(name);
      })
      .reduce((sum, line) => {
        const amount = Number(line.amount ?? line.dosageGrams ?? 0);
        const density =
          line.ingredient.densityKgPerL ?? line.ingredient.density ?? null;
        return (
          sum +
          savedLineAmountToLiters({
            amount: Number.isFinite(amount) ? amount : 0,
            unit: line.unit ?? "g",
            densityKgPerL: density,
          })
        );
      }, 0);

    const baseTotalCostEur =
      calc.totalCostEur != null && Number.isFinite(calc.totalCostEur)
        ? calc.totalCostEur
        : null;

    return {
      baseTotalCostEur,
      scaledTotalCostEur:
        baseTotalCostEur == null ? null : baseTotalCostEur * batchLitersValue,
      baseWaterTopUpL,
      scaledWaterTopUpL: baseWaterTopUpL * batchLitersValue,
    };
  }, [savedForBatch, batchLitersValue]);

  const targetDensity = useMemo(() => {
    const targetBrix = toOptionalNumber(form.targetBrix);
    if (form.densityOverrideEnabled) {
      const override = toOptionalNumber(form.targetDensity);
      return override != null && Number.isFinite(override) ? override : null;
    }

    if (targetBrix == null || !Number.isFinite(targetBrix)) {
      return null;
    }

    const corrected = applyBrixTemperatureCorrection(targetBrix, 20);
    const densityGPerMl = brixToDensityGPerML(corrected);
    return densityGPerMl * 1;
  }, [form.targetBrix, form.densityOverrideEnabled, form.targetDensity]);

  useEffect(() => {
    if (!waterIngredientId || !specsCalc) {
      return;
    }

    const waterToAdd = Math.max(0, specsCalc.suggestions.waterToAddL);
    const nextDosage = waterToAdd.toFixed(3);

    setForm((prev) => {
      const waterIndex = prev.items.findIndex(
        (row) => row.ingredientId === waterIngredientId,
      );

      const waterName =
        ingredientById.get(waterIngredientId)?.ingredientName ??
        ingredientById.get(waterIngredientId)?.name ??
        "Water";

      if (waterIndex === -1) {
        if (waterToAdd <= 0.0001) {
          return prev;
        }

        return {
          ...prev,
          items: orderRowsWithWaterLast(
            [
              ...prev.items,
              {
                ...createExistingRow(),
                ingredientId: waterIngredientId,
                basePricePerKg:
                  ingredientById.get(waterIngredientId)
                    ?.effectivePricePerKgEur ??
                  ingredientById.get(waterIngredientId)?.pricePerKgEur ??
                  ingredientById.get(waterIngredientId)?.pricePerKg ??
                  null,
                search: waterName,
                dosageGrams: nextDosage,
                unit: "L",
              },
            ],
            waterIngredientId,
          ),
        };
      }

      if (waterToAdd <= 0.0001) {
        const nextItems = orderRowsWithWaterLast(
          prev.items.filter((_, index) => index !== waterIndex),
          waterIngredientId,
        );
        return {
          ...prev,
          items: nextItems.length > 0 ? nextItems : [createExistingRow()],
        };
      }

      const currentWater = prev.items[waterIndex];
      if (
        currentWater.dosageGrams === nextDosage &&
        currentWater.unit === "L" &&
        currentWater.ingredientId === waterIngredientId &&
        currentWater.basePricePerKg ===
          (ingredientById.get(waterIngredientId)?.effectivePricePerKgEur ??
            ingredientById.get(waterIngredientId)?.pricePerKgEur ??
            ingredientById.get(waterIngredientId)?.pricePerKg ??
            currentWater.basePricePerKg) &&
        currentWater.search === (currentWater.search || waterName)
      ) {
        return prev;
      }

      const nextItems: BuilderRow[] = prev.items.map((row, index) =>
        index === waterIndex
          ? {
              ...row,
              dosageGrams: nextDosage,
              unit: "L" as BuilderRow["unit"],
              search: row.search || waterName,
              ingredientId: waterIngredientId,
              basePricePerKg:
                ingredientById.get(waterIngredientId)?.effectivePricePerKgEur ??
                ingredientById.get(waterIngredientId)?.pricePerKgEur ??
                ingredientById.get(waterIngredientId)?.pricePerKg ??
                row.basePricePerKg,
            }
          : row,
      );

      return {
        ...prev,
        items: orderRowsWithWaterLast(nextItems, waterIngredientId),
      };
    });
  }, [waterIngredientId, specsCalc, ingredientById]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const loadFormulations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/formulations", { cache: "no-store" });
      const data = await readJsonSafe<Formulation[] | ApiErrorResponse>(
        response,
      );

      if (!response.ok) {
        throw new Error(
          (data as ApiErrorResponse | null)?.error?.message ||
            `Failed to load formulations (HTTP ${response.status}).`,
        );
      }

      setFormulations((data as Formulation[]) ?? []);
    } catch (fetchError: unknown) {
      setError(getErrorMessage(fetchError));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadIngredientCatalog = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: "100",
        includeEffective: "true",
      });
      if (editingId) {
        params.set("scopeType", "formulation");
        params.set("scopeId", editingId);
      } else {
        params.set("scopeType", "global");
      }

      const response = await fetch(`/api/ingredients?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await readJsonSafe<
        { items?: Ingredient[] } | Ingredient[] | ApiErrorResponse
      >(response);

      if (!response.ok) {
        throw new Error(
          (data as ApiErrorResponse | null)?.error?.message ||
            `Failed to load ingredients (HTTP ${response.status}).`,
        );
      }

      const items = Array.isArray(data)
        ? data
        : Array.isArray((data as { items?: Ingredient[] } | null)?.items)
          ? (data as { items: Ingredient[] }).items
          : [];

      setIngredientCatalog(items);
    } catch {
      setIngredientCatalog([]);
    }
  }, [editingId]);

  useEffect(() => {
    void loadFormulations();
    void loadIngredientCatalog();
  }, [loadFormulations, loadIngredientCatalog]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.closest("[data-ingredient-autocomplete='true']")) {
        return;
      }

      setForm((prev) => ({
        ...prev,
        items: prev.items.map((row) => ({ ...row, open: false })),
      }));
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  function updateRow(rowId: string, updater: (row: BuilderRow) => BuilderRow) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((row) => (row.id === rowId ? updater(row) : row)),
    }));
  }

  function addRow() {
    setForm((prev) => ({
      ...prev,
      items: orderRowsWithWaterLast(
        [createExistingRow(), ...prev.items],
        waterIngredientId,
      ),
    }));
  }

  function removeRow(rowId: string) {
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length === 1
          ? prev.items
          : orderRowsWithWaterLast(
              prev.items.filter((row) => row.id !== rowId),
              waterIngredientId,
            ),
    }));
  }

  function duplicateRow(rowId: string) {
    setForm((prev) => {
      const row = prev.items.find((item) => item.id === rowId);
      if (!row) {
        return prev;
      }

      return {
        ...prev,
        items: orderRowsWithWaterLast(
          [{ ...row, id: createRowId(), open: false }, ...prev.items],
          waterIngredientId,
        ),
      };
    });
  }

  async function searchIngredients(rowId: string, query: string) {
    const trimmed = query.trim();

    updateRow(rowId, (row) => ({
      ...row,
      search: query,
      searching: trimmed.length > 0,
      open: trimmed.length > 0,
      highlightedIndex: -1,
    }));

    if (!trimmed) {
      updateRow(rowId, (row) => ({
        ...row,
        options: [],
        searching: false,
        highlightedIndex: -1,
      }));
      return;
    }

    try {
      const params = new URLSearchParams({
        q: trimmed,
        includeEffective: "true",
      });
      if (editingId) {
        params.set("scopeType", "formulation");
        params.set("scopeId", editingId);
      } else {
        params.set("scopeType", "global");
      }

      const res = await fetch(`/api/ingredients?${params.toString()}`);
      const data = await readJsonSafe<
        { items?: Ingredient[] } | Ingredient[] | ApiErrorResponse
      >(res);

      if (!res.ok) {
        throw new Error(
          (data as ApiErrorResponse | null)?.error?.message ||
            `Ingredient search failed (HTTP ${res.status}).`,
        );
      }

      const items = Array.isArray(data)
        ? data
        : Array.isArray((data as { items?: Ingredient[] } | null)?.items)
          ? (data as { items: Ingredient[] }).items
          : [];

      updateRow(rowId, (row) => ({
        ...row,
        options: items,
        searching: false,
        open: true,
        highlightedIndex: items.length > 0 ? 0 : -1,
      }));
    } catch {
      updateRow(rowId, (row) => ({
        ...row,
        options: [],
        searching: false,
        open: false,
        highlightedIndex: -1,
      }));
    }
  }

  function ensureSpecDraft(ingredient: Ingredient): SpecOverrideDraft {
    const existing = specOverrideDrafts[ingredient.id];
    if (existing) {
      return existing;
    }

    return {
      open: false,
      autoCalculate: true,
      overridePricePerKgEur: "",
      overrideDensityKgPerL: "",
      overrideBrixPercent: "",
      overrideTitratableAcidityPercent: "",
      overrideId: ingredient.effectiveOverrideId ?? null,
    };
  }

  function toggleSpecPanel(ingredient: Ingredient) {
    setSpecOverrideDrafts((prev) => {
      const current = ensureSpecDraft(ingredient);
      return {
        ...prev,
        [ingredient.id]: {
          ...current,
          open: !current.open,
        },
      };
    });
  }

  function updateSpecDraft(
    ingredient: Ingredient,
    updater: (draft: SpecOverrideDraft) => SpecOverrideDraft,
  ) {
    setSpecOverrideDrafts((prev) => {
      const current = prev[ingredient.id] ?? ensureSpecDraft(ingredient);
      return {
        ...prev,
        [ingredient.id]: updater(current),
      };
    });
  }

  async function saveFormulationSpecOverride(ingredient: Ingredient) {
    const draft =
      specOverrideDrafts[ingredient.id] ?? ensureSpecDraft(ingredient);

    if (!editingId) {
      setError(
        "Save formulation first, then persist formulation-level overrides.",
      );
      return;
    }

    const parseField = (value: string): number | null => {
      const normalized = value.trim().replace(",", ".");
      if (!normalized) return null;
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const response = await fetch("/api/ingredient-overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredientId: ingredient.id,
        scopeType: "formulation",
        scopeId: editingId,
        overridePricePerKgEur: parseField(draft.overridePricePerKgEur),
        overrideDensityKgPerL: parseField(draft.overrideDensityKgPerL),
        overrideBrixPercent: parseField(draft.overrideBrixPercent),
        overrideTitratableAcidityPercent: parseField(
          draft.overrideTitratableAcidityPercent,
        ),
        notes: "Formulation-level override",
      }),
    });

    const data = await readJsonSafe<{
      id?: string;
      error?: { message?: string };
    }>(response);
    if (!response.ok) {
      throw new Error(
        data?.error?.message || "Failed to save formulation override.",
      );
    }

    setSpecOverrideDrafts((prev) => ({
      ...prev,
      [ingredient.id]: {
        ...(prev[ingredient.id] ?? draft),
        overrideId: data?.id ?? prev[ingredient.id]?.overrideId ?? null,
      },
    }));

    await loadIngredientCatalog();
  }

  async function resetFormulationSpecOverride(ingredient: Ingredient) {
    const draft =
      specOverrideDrafts[ingredient.id] ?? ensureSpecDraft(ingredient);
    const overrideId =
      draft.overrideId ?? ingredient.effectiveOverrideId ?? null;

    if (!overrideId) {
      return;
    }

    const response = await fetch(`/api/ingredient-overrides/${overrideId}`, {
      method: "DELETE",
    });
    const data = await readJsonSafe<{ error?: { message?: string } }>(response);
    if (!response.ok) {
      throw new Error(
        data?.error?.message || "Failed to reset formulation override.",
      );
    }

    setSpecOverrideDrafts((prev) => ({
      ...prev,
      [ingredient.id]: {
        ...(prev[ingredient.id] ?? draft),
        overridePricePerKgEur: "",
        overrideDensityKgPerL: "",
        overrideBrixPercent: "",
        overrideTitratableAcidityPercent: "",
        overrideId: null,
      },
    }));

    await loadIngredientCatalog();
  }

  function selectIngredientOption(rowId: string, option: Ingredient) {
    updateRow(rowId, (current) => ({
      ...current,
      ingredientId: option.id,
      basePricePerKg:
        option.effectivePricePerKgEur ??
        option.pricePerKgEur ??
        option.pricePerKg ??
        null,
      search: option.ingredientName || option.name || "",
      open: false,
      highlightedIndex: -1,
    }));
  }

  function startEditFormulation(formulation: Formulation) {
    setEditingId(formulation.id);
    setError(null);
    setForm({
      name: formulation.name,
      category: isFormulationCategory(formulation.category)
        ? formulation.category
        : "",
      finalVolumeL: "1",
      batchSizeUnit: "L",
      targetAcidity: "",
      targetDensity: "",
      densityOverrideEnabled: false,
      desiredBrix:
        formulation.desiredBrix == null ? "" : String(formulation.desiredBrix),
      temperatureC:
        formulation.temperatureC == null
          ? "20"
          : String(formulation.temperatureC),
      targetBrix:
        formulation.targetBrix == null ? "" : String(formulation.targetBrix),
      targetPH:
        formulation.targetPH == null ? "" : String(formulation.targetPH),
      co2GPerL:
        formulation.co2GPerL == null ? "" : String(formulation.co2GPerL),
      notes: formulation.notes ?? "",
      items: formulation.ingredients.map((item) => {
        const rawAmount = Number(item.amount ?? item.dosageGrams ?? 0);
        const rawUnit = item.unit ?? "g";
        const normalizedAmount =
          rawUnit === "kg" ? rawAmount * 1000 : rawAmount;
        const normalizedUnit = rawUnit === "kg" ? "g" : rawUnit;

        return {
          ...createExistingRow(),
          ingredientId: item.ingredientId,
          basePricePerKg:
            item.ingredient.pricePerKgEur ?? item.ingredient.pricePerKg ?? null,
          overridePricePerKg:
            item.priceOverridePerKg == null
              ? ""
              : String(item.priceOverridePerKg),
          useOverride: item.priceOverridePerKg != null,
          search:
            item.ingredient.ingredientName || item.ingredient.name || "Unknown",
          dosageGrams: String(
            Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
          ),
          unit: normalizedUnit as BuilderRow["unit"],
        };
      }),
    });
  }

  function cancelEditFormulation() {
    setEditingId(null);
    setError(null);
    setForm({
      name: "",
      category: "",
      finalVolumeL: "1",
      batchSizeUnit: "L",
      targetAcidity: "",
      targetDensity: "",
      densityOverrideEnabled: false,
      desiredBrix: "",
      temperatureC: "20",
      targetBrix: "",
      targetPH: "",
      co2GPerL: "",
      notes: "",
      items: [createExistingRow()],
    });
  }

  async function deleteFormulation(formulationId: string) {
    if (deletingId || saving) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this formulation? This action cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(formulationId);
    setError(null);

    try {
      const response = await fetch(`/api/formulations/${formulationId}`, {
        method: "DELETE",
      });

      const data = await readJsonSafe<{ ok?: boolean } | ApiErrorResponse>(
        response,
      );
      if (!response.ok) {
        throw new Error(
          (data as ApiErrorResponse | null)?.error?.message ||
            `Failed to delete formulation (HTTP ${response.status}).`,
        );
      }

      if (editingId === formulationId) {
        cancelEditFormulation();
      }

      if (savedForBatch?.id === formulationId) {
        setSavedForBatch(null);
      }

      await loadFormulations();
      showToast("Formulation deleted.");
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeletingId(null);
    }
  }

  function applySugarSuggestion() {
    if (!specsCalc || !Number.isFinite(specsCalc.suggestions.sugarKg ?? NaN)) {
      return;
    }

    const sugarIngredient = suggestedSugarIngredient;
    if (!sugarIngredient) {
      return;
    }

    const suggestedGrams = massKgToGrams(
      Math.max(0, specsCalc.suggestions.sugarKg ?? 0),
    );

    setForm((prev) => {
      const index = prev.items.findIndex(
        (row) => row.ingredientId === sugarIngredient.id,
      );

      if (index === -1) {
        const nextItems = orderRowsWithWaterLast(
          [
            {
              ...createExistingRow(),
              ingredientId: sugarIngredient.id,
              search:
                sugarIngredient.ingredientName ||
                sugarIngredient.name ||
                "Sugar",
              basePricePerKg:
                sugarIngredient.effectivePricePerKgEur ??
                sugarIngredient.pricePerKgEur ??
                sugarIngredient.pricePerKg ??
                null,
              dosageGrams: suggestedGrams.toFixed(2),
              unit: "g",
            },
            ...prev.items,
          ],
          waterIngredientId,
        );

        return {
          ...prev,
          items: nextItems,
        };
      }

      return {
        ...prev,
        items: prev.items.map((row, rowIndex) =>
          rowIndex === index
            ? {
                ...row,
                dosageGrams: suggestedGrams.toFixed(2),
                unit: "g",
              }
            : row,
        ),
      };
    });
  }

  function applyCitricSuggestion() {
    if (!specsCalc || !Number.isFinite(specsCalc.suggestions.citricKg ?? NaN)) {
      return;
    }

    const citricIngredient = suggestedCitricIngredient;
    if (!citricIngredient) {
      return;
    }

    const suggestedGrams = massKgToGrams(
      Math.max(0, specsCalc.suggestions.citricKg ?? 0),
    );

    setForm((prev) => {
      const index = prev.items.findIndex(
        (row) => row.ingredientId === citricIngredient.id,
      );

      if (index === -1) {
        const nextItems = orderRowsWithWaterLast(
          [
            {
              ...createExistingRow(),
              ingredientId: citricIngredient.id,
              search:
                citricIngredient.ingredientName ||
                citricIngredient.name ||
                "Citric acid",
              basePricePerKg:
                citricIngredient.effectivePricePerKgEur ??
                citricIngredient.pricePerKgEur ??
                citricIngredient.pricePerKg ??
                null,
              dosageGrams: suggestedGrams.toFixed(2),
              unit: "g",
            },
            ...prev.items,
          ],
          waterIngredientId,
        );

        return {
          ...prev,
          items: nextItems,
        };
      }

      return {
        ...prev,
        items: prev.items.map((row, rowIndex) =>
          rowIndex === index
            ? {
                ...row,
                dosageGrams: suggestedGrams.toFixed(2),
                unit: "g",
              }
            : row,
        ),
      };
    });
  }

  async function submitForm(options?: { autosave?: boolean }) {
    const autosaveMode = Boolean(options?.autosave);

    if (!isValid || saving || autosaving) {
      return;
    }

    if (autosaveMode && !editingId) {
      return;
    }

    if (autosaveMode) {
      setAutosaving(true);
    } else {
      setSaving(true);
    }
    setError(null);

    try {
      const payload: CreateFormulationPayload = {
        name: form.name.trim(),
        category: form.category,
        desiredBrix: toOptionalNumber(form.desiredBrix),
        temperatureC:
          toOptionalNumber(form.desiredBrix) === null
            ? null
            : (toOptionalNumber(form.temperatureC) ?? 20),
        targetBrix: toOptionalNumber(form.targetBrix),
        targetPH: toOptionalNumber(form.targetPH),
        co2GPerL:
          form.category === "Carbonated soft drink"
            ? toOptionalNumber(form.co2GPerL)
            : null,
        notes: form.notes.trim() || null,
        items: form.items.map((row) => ({
          amount: parseNumber(row.dosageGrams),
          unit: row.unit,
          ingredientId: row.ingredientId,
          ...(row.useOverride
            ? { priceOverridePerKg: parseOverridePrice(row.overridePricePerKg) }
            : {}),
        })),
      };

      const response = await fetch(
        editingId ? `/api/formulations/${editingId}` : "/api/formulations",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await readJsonSafe<Formulation | ApiErrorResponse>(response);
      if (!response.ok) {
        throw new Error(
          (data as ApiErrorResponse | null)?.error?.message ||
            `Failed to ${editingId ? "update" : "create"} formulation (HTTP ${response.status}).`,
        );
      }

      await loadFormulations();

      if (!autosaveMode && data && "id" in data) {
        setSavedForBatch(data as Formulation);
      }

      if (!autosaveMode) {
        cancelEditFormulation();
        showToast(
          editingId
            ? "Formulation updated successfully."
            : "Formulation created successfully.",
        );
      }
    } catch (submitError: unknown) {
      setError(getErrorMessage(submitError));
    } finally {
      if (autosaveMode) {
        setAutosaving(false);
      } else {
        setSaving(false);
      }
    }
  }

  useEffect(() => {
    if (!editingId || !isValid || saving || autosaving) {
      return;
    }

    const handle = window.setTimeout(() => {
      void submitForm({ autosave: true });
    }, 700);

    return () => window.clearTimeout(handle);
  }, [editingId, form, isValid, saving, autosaving]);

  return (
    <main className="py-6">
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 shadow">
          {toast}
        </div>
      ) : null}

      <h1 className="text-2xl font-semibold text-gray-900">Formulations</h1>
      <p className="mt-2 text-gray-600">
        Build beverage formulations using preloaded ingredients.
      </p>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingId ? "Edit formulation" : "New formulation"}
          </h2>
          {editingId ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              Editing: {form.name.trim() || "Untitled formulation"}
            </span>
          ) : null}
          {editingId ? (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {autosaving ? "Autosaving..." : "Autosave on"}
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="order-2 md:col-span-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">
              Taste & quality specs
            </h3>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Formula basis
                </label>
                <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                  1.00 L (fixed during formulation authoring)
                </div>
                {validation.finalVolumeL ? (
                  <p className="mt-1 text-xs text-red-600">
                    {editorErrors.finalVolumeL?.message ??
                      validation.finalVolumeL}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Brix (°Bx)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.targetBrix}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      targetBrix: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. 10.5"
                  title="Soluble solids / sweetness level."
                />
                {validation.targetBrix ? (
                  <p className="mt-1 text-xs text-red-600">
                    {editorErrors.targetBrix?.message ?? validation.targetBrix}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Titratable acidity target (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.targetAcidity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      targetAcidity: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. 1.35"
                  title="Target titratable acidity percent for this 1L formula."
                />
                {validation.targetAcidity ? (
                  <p className="mt-1 text-xs text-red-600">
                    {editorErrors.targetAcidity?.message ??
                      validation.targetAcidity}
                  </p>
                ) : null}
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Density (kg/L)
                  </label>
                  <label className="inline-flex items-center gap-1 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={form.densityOverrideEnabled}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          densityOverrideEnabled: e.target.checked,
                        }))
                      }
                    />
                    Override
                  </label>
                </div>
                <input
                  type="number"
                  step="0.0001"
                  value={
                    form.densityOverrideEnabled
                      ? form.targetDensity
                      : targetDensity == null
                        ? ""
                        : targetDensity.toFixed(4)
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      targetDensity: e.target.value,
                    }))
                  }
                  readOnly={!form.densityOverrideEnabled}
                  className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm ${
                    form.densityOverrideEnabled ? "" : "bg-gray-100"
                  }`}
                  placeholder="Auto"
                />
                {validation.targetDensity ? (
                  <p className="mt-1 text-xs text-red-600">
                    {editorErrors.targetDensity?.message ??
                      validation.targetDensity}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g., Sparkling Orange Base"
            />
            {validation.name ? (
              <p className="mt-1 text-xs text-red-600">{validation.name}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  category: e.target.value as FormulationCategory | "",
                  co2GPerL:
                    e.target.value === "Carbonated soft drink"
                      ? prev.co2GPerL || "5.0"
                      : "",
                }))
              }
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">Select category</option>
              {FORMULATION_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {validation.category ? (
              <p className="mt-1 text-xs text-red-600">{validation.category}</p>
            ) : null}
          </div>

          {form.category === "Carbonated soft drink" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                CO₂ (g/L)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.co2GPerL}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, co2GPerL: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="5.0"
              />
              <p className="mt-1 text-xs text-gray-500">
                Typical soft drinks: 4–6 g/L (default 5.0)
              </p>
              {validation.co2GPerL ? (
                <p className="mt-1 text-xs text-red-600">
                  {validation.co2GPerL}
                </p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Optional pH
            </label>
            <input
              value={form.targetPH}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, targetPH: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Optional"
              inputMode="decimal"
            />
            {validation.targetPH ? (
              <p className="mt-1 text-xs text-red-600">{validation.targetPH}</p>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Optional process or sensory notes"
            />
          </div>
        </div>

        <div className="mt-6 border-t border-gray-100 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Ingredient items
            </h3>
            <button
              onClick={addRow}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              + Add row
            </button>
          </div>

          {form.items.map((row, rowIndex) => {
            const rowErrors = validation.rowErrors[row.id] ?? {};
            const isAutoWaterRow =
              waterIngredientId !== null &&
              row.ingredientId === waterIngredientId &&
              specsCalc !== null;
            const contribution = lineContributions.get(row.id);
            const selectedIngredient = applyDraftOverrides(
              ingredientById.get(row.ingredientId),
              row.ingredientId,
            );
            const listboxId = `ingredient-options-${row.id}`;
            const activeDescendantId =
              row.open &&
              row.highlightedIndex >= 0 &&
              row.options[row.highlightedIndex]
                ? `ingredient-option-${row.id}-${row.options[row.highlightedIndex].id}`
                : undefined;

            return (
              <div
                key={row.id}
                className="mb-4 rounded-lg border border-gray-200 p-3"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {isAutoWaterRow
                      ? "Water (auto-calculated)"
                      : "Select existing ingredient"}
                  </p>

                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => duplicateRow(row.id)}
                      disabled={isAutoWaterRow}
                      className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => removeRow(row.id)}
                      disabled={form.items.length === 1 || isAutoWaterRow}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {row.ingredientId ? (
                  <div className="mb-2 inline-flex rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                    {ingredientById.get(row.ingredientId)?.category ??
                      "Uncategorized"}
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr]">
                  <div className="relative" data-ingredient-autocomplete="true">
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Search ingredient
                    </label>
                    <input
                      value={row.search}
                      disabled={isAutoWaterRow}
                      onChange={(e) => {
                        void searchIngredients(row.id, e.target.value);
                      }}
                      onFocus={() =>
                        updateRow(row.id, (current) =>
                          current.options.length > 0
                            ? { ...current, open: true }
                            : current,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          updateRow(row.id, (current) => ({
                            ...current,
                            open: false,
                            highlightedIndex: -1,
                          }));
                          return;
                        }

                        if (event.key === "ArrowDown") {
                          event.preventDefault();
                          updateRow(row.id, (current) => {
                            if (current.options.length === 0) {
                              return current;
                            }

                            const nextIndex =
                              current.highlightedIndex <
                              current.options.length - 1
                                ? current.highlightedIndex + 1
                                : 0;

                            return {
                              ...current,
                              open: true,
                              highlightedIndex: nextIndex,
                            };
                          });
                          return;
                        }

                        if (event.key === "ArrowUp") {
                          event.preventDefault();
                          updateRow(row.id, (current) => {
                            if (current.options.length === 0) {
                              return current;
                            }

                            const nextIndex =
                              current.highlightedIndex > 0
                                ? current.highlightedIndex - 1
                                : current.options.length - 1;

                            return {
                              ...current,
                              open: true,
                              highlightedIndex: nextIndex,
                            };
                          });
                          return;
                        }

                        if (event.key !== "Enter") {
                          return;
                        }

                        event.preventDefault();
                        const selectedOption =
                          row.options[
                            row.highlightedIndex >= 0 ? row.highlightedIndex : 0
                          ];

                        if (!selectedOption) {
                          return;
                        }

                        selectIngredientOption(row.id, selectedOption);
                      }}
                      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm ${
                        isAutoWaterRow ? "cursor-not-allowed bg-gray-50" : ""
                      }`}
                      placeholder={
                        isAutoWaterRow ? "Water" : "Type ingredient name"
                      }
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={row.open}
                      aria-controls={row.open ? listboxId : undefined}
                      aria-activedescendant={activeDescendantId}
                    />

                    {row.open && row.options.length > 0 ? (
                      <div
                        id={listboxId}
                        role="listbox"
                        className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow"
                      >
                        {row.options.map((option, optionIndex) => (
                          <button
                            key={option.id}
                            id={`ingredient-option-${row.id}-${option.id}`}
                            role="option"
                            aria-selected={row.highlightedIndex === optionIndex}
                            onClick={() =>
                              selectIngredientOption(row.id, option)
                            }
                            onMouseEnter={() =>
                              updateRow(row.id, (current) => ({
                                ...current,
                                highlightedIndex: optionIndex,
                              }))
                            }
                            className={`flex w-full items-center justify-between border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50 ${
                              row.highlightedIndex === optionIndex
                                ? "bg-blue-50"
                                : ""
                            }`}
                          >
                            <span>
                              {option.ingredientName || option.name}{" "}
                              <span className="text-gray-500">
                                ({option.category})
                              </span>
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatPricePerKg(
                                option.effectivePricePerKgEur ??
                                  option.pricePerKgEur ??
                                  option.pricePerKg ??
                                  0,
                              )}{" "}
                              EUR/kg
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {row.searching ? (
                      <p className="mt-1 text-xs text-gray-500">Searching...</p>
                    ) : null}

                    {rowErrors.ingredientId ? (
                      <p className="mt-1 text-xs text-red-600">
                        {rowErrors.ingredientId}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Amount
                    </label>
                    <input
                      value={row.dosageGrams}
                      readOnly={isAutoWaterRow}
                      onChange={(e) =>
                        updateRow(row.id, (current) => ({
                          ...current,
                          dosageGrams: e.target.value,
                        }))
                      }
                      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm ${
                        isAutoWaterRow ? "cursor-not-allowed bg-gray-50" : ""
                      }`}
                      placeholder="e.g., 25"
                      inputMode="decimal"
                    />
                    {rowErrors.dosageGrams ||
                    editorErrors.items?.[rowIndex]?.amount ? (
                      <p className="mt-1 text-xs text-red-600">
                        {editorErrors.items?.[rowIndex]?.amount?.message ??
                          rowErrors.dosageGrams}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Unit
                    </label>
                    <select
                      value={row.unit}
                      disabled={isAutoWaterRow}
                      onChange={(e) =>
                        updateRow(row.id, (current) => ({
                          ...current,
                          unit: e.target.value as BuilderRow["unit"],
                        }))
                      }
                      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm ${
                        isAutoWaterRow ? "cursor-not-allowed bg-gray-50" : ""
                      }`}
                    >
                      <option value="g">g</option>
                      <option value="L">L</option>
                      <option value="ml">ml</option>
                      <option value="mL">mL</option>
                      <option value="%w/w">%w/w</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 rounded-md border border-gray-100 bg-gray-50 p-2 text-xs text-gray-700 md:grid-cols-4">
                  <p>
                    Density:{" "}
                    <span className="font-semibold">
                      {contribution
                        ? contribution.densityKgPerL.toFixed(4)
                        : "—"}{" "}
                      kg/L
                    </span>
                  </p>
                  <p>
                    Mass:{" "}
                    <span className="font-semibold">
                      {contribution
                        ? massKgToGrams(contribution.massKg).toFixed(1)
                        : "—"}{" "}
                      g
                    </span>
                  </p>
                  <p>
                    Solids:{" "}
                    <span className="font-semibold">
                      {contribution
                        ? massKgToGrams(contribution.solidsKg).toFixed(1)
                        : "—"}{" "}
                      g
                    </span>
                  </p>
                  <p>
                    Titratable acidity:{" "}
                    <span className="font-semibold">
                      {contribution
                        ? (acidKgPerMassKgToPercent(
                            contribution.acidKg,
                            contribution.massKg,
                          )?.toFixed(2) ?? "—")
                        : "—"}{" "}
                      %
                    </span>
                  </p>
                </div>

                {selectedIngredient ? (
                  <div className="mt-3 rounded-md border border-blue-100 bg-blue-50/40 p-3">
                    <button
                      type="button"
                      onClick={() => toggleSpecPanel(selectedIngredient)}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-blue-800"
                    >
                      ✎ Ingredient Specs
                    </button>

                    {(specOverrideDrafts[selectedIngredient.id]?.open ??
                    false) ? (
                      <div className="mt-3 space-y-3">
                        <label className="inline-flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={
                              specOverrideDrafts[selectedIngredient.id]
                                ?.autoCalculate ?? true
                            }
                            onChange={(event) =>
                              updateSpecDraft(selectedIngredient, (draft) => ({
                                ...draft,
                                autoCalculate: event.target.checked,
                              }))
                            }
                          />
                          Auto-calculate Brix ↔ Density
                        </label>

                        <div className="grid gap-2 md:grid-cols-4">
                          <input
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            placeholder="Brix (%)"
                            value={
                              specOverrideDrafts[selectedIngredient.id]
                                ?.overrideBrixPercent ?? ""
                            }
                            onChange={(event) => {
                              const nextBrix = event.target.value;
                              updateSpecDraft(selectedIngredient, (draft) => {
                                if (!draft.autoCalculate) {
                                  return {
                                    ...draft,
                                    overrideBrixPercent: nextBrix,
                                  };
                                }

                                const next = applyAutoSync({
                                  state: {
                                    brixPercent: draft.overrideBrixPercent,
                                    densityKgPerL: draft.overrideDensityKgPerL,
                                    lastEditedField: null,
                                  },
                                  editedField: "brix",
                                  nextRawValue: nextBrix,
                                  autoCalculate: true,
                                });

                                return {
                                  ...draft,
                                  overrideBrixPercent: next.brixPercent,
                                  overrideDensityKgPerL: next.densityKgPerL,
                                };
                              });
                            }}
                          />
                          <input
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            placeholder="Density (kg/L)"
                            value={
                              specOverrideDrafts[selectedIngredient.id]
                                ?.overrideDensityKgPerL ?? ""
                            }
                            onChange={(event) => {
                              const nextDensity = event.target.value;
                              updateSpecDraft(selectedIngredient, (draft) => {
                                if (!draft.autoCalculate) {
                                  return {
                                    ...draft,
                                    overrideDensityKgPerL: nextDensity,
                                  };
                                }

                                const next = applyAutoSync({
                                  state: {
                                    brixPercent: draft.overrideBrixPercent,
                                    densityKgPerL: draft.overrideDensityKgPerL,
                                    lastEditedField: null,
                                  },
                                  editedField: "density",
                                  nextRawValue: nextDensity,
                                  autoCalculate: true,
                                });

                                return {
                                  ...draft,
                                  overrideBrixPercent: next.brixPercent,
                                  overrideDensityKgPerL: next.densityKgPerL,
                                };
                              });
                            }}
                          />
                          <input
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            placeholder="TA (%)"
                            value={
                              specOverrideDrafts[selectedIngredient.id]
                                ?.overrideTitratableAcidityPercent ?? ""
                            }
                            onChange={(event) =>
                              updateSpecDraft(selectedIngredient, (draft) => ({
                                ...draft,
                                overrideTitratableAcidityPercent:
                                  event.target.value,
                              }))
                            }
                          />
                          <input
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            placeholder="Price/kg EUR"
                            value={
                              specOverrideDrafts[selectedIngredient.id]
                                ?.overridePricePerKgEur ?? ""
                            }
                            onChange={(event) =>
                              updateSpecDraft(selectedIngredient, (draft) => ({
                                ...draft,
                                overridePricePerKgEur: event.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void saveFormulationSpecOverride(
                                selectedIngredient,
                              );
                            }}
                            className="rounded border border-blue-200 bg-white px-2 py-1 text-xs text-blue-700"
                          >
                            Save override
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void resetFormulationSpecOverride(
                                selectedIngredient,
                              );
                            }}
                            className="rounded border border-amber-200 bg-white px-2 py-1 text-xs text-amber-700"
                          >
                            Reset to database
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="mt-4 overflow-x-auto rounded-md border border-gray-200 bg-white">
            <table className="w-full min-w-220 text-sm">
              <thead className="bg-gray-50 text-left text-gray-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Ingredient</th>
                  <th className="px-3 py-2 font-medium">Base Price (USD/kg)</th>
                  <th className="px-3 py-2 font-medium">Use Custom Price</th>
                  <th className="px-3 py-2 font-medium">
                    Custom Price (USD/kg)
                  </th>
                  <th className="px-3 py-2 font-medium">
                    Effective Price (USD/kg)
                  </th>
                  <th className="px-3 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {form.items
                  .filter((row) => Boolean(row.ingredientId))
                  .map((row) => {
                    const rowErrors = validation.rowErrors[row.id] ?? {};
                    const ingredient = ingredientById.get(row.ingredientId);
                    const ingredientName =
                      ingredient?.ingredientName ||
                      ingredient?.name ||
                      row.search ||
                      "—";
                    const basePricePerKg = resolveBasePricePerKg(
                      row,
                      ingredientById,
                    );
                    const overridePricePerKg = parseOverridePrice(
                      row.overridePricePerKg,
                    );
                    const effectivePricePerKg = getEffectivePricePerKg({
                      basePricePerKg,
                      overridePricePerKg,
                      useOverride: row.useOverride,
                    });

                    return (
                      <tr
                        key={`pricing-${row.id}`}
                        className="border-t border-gray-100"
                      >
                        <td className="px-3 py-2 text-gray-900">
                          {ingredientName}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {basePricePerKg != null && basePricePerKg > 0
                            ? formatPricePerKg(basePricePerKg)
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={row.useOverride}
                              onChange={(event) =>
                                updateRow(row.id, (current) => ({
                                  ...current,
                                  useOverride: event.target.checked,
                                  overridePricePerKg: event.target.checked
                                    ? current.overridePricePerKg
                                    : "",
                                }))
                              }
                              className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            />
                            Custom
                          </label>
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          <input
                            value={row.overridePricePerKg}
                            onChange={(event) =>
                              updateRow(row.id, (current) => ({
                                ...current,
                                overridePricePerKg: event.target.value,
                              }))
                            }
                            disabled={!row.useOverride}
                            className={`w-36 rounded-md border px-2 py-1.5 text-sm ${
                              row.useOverride
                                ? "border-gray-300 bg-white"
                                : "cursor-not-allowed border-gray-200 bg-gray-50"
                            }`}
                            placeholder="e.g. 3.250"
                            inputMode="decimal"
                          />
                          {rowErrors.overridePricePerKg ? (
                            <p className="mt-1 text-xs text-red-600">
                              {rowErrors.overridePricePerKg}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {effectivePricePerKg > 0
                            ? formatPricePerKg(effectivePricePerKg)
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              updateRow(row.id, (current) => ({
                                ...current,
                                useOverride: false,
                                overridePricePerKg: "",
                              }))
                            }
                            className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Reset
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-700">
            Total mass:{" "}
            <span className="font-semibold">{totalGrams.toFixed(2)} g</span>
          </p>

          {validation.totalGrams ? (
            <p className="mt-1 text-xs text-red-600">{validation.totalGrams}</p>
          ) : null}

          {validation.items ? (
            <p className="mt-1 text-xs text-red-600">{validation.items}</p>
          ) : null}

          <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50/30 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-blue-900">
                Calculated Results
              </h3>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  advancedCalc?.status === "complete"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {advancedCalc?.status === "complete" ? "Complete" : "Partial"}
              </span>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-gray-700 md:grid-cols-2">
              <p>
                Final Brix (%):{" "}
                <span className="font-semibold">
                  {advancedCalc?.finalBrixPercent != null
                    ? advancedCalc.finalBrixPercent.toFixed(3)
                    : "—"}
                </span>
              </p>
              <p>
                Final Titratable Acidity (%):{" "}
                <span className="font-semibold">
                  {advancedCalc?.finalTitratableAcidityPercent != null
                    ? advancedCalc.finalTitratableAcidityPercent.toFixed(3)
                    : "—"}
                </span>
              </p>
              <p>
                Total Juice Equivalent (g):{" "}
                <span className="font-semibold">
                  {advancedCalc?.totalJuiceEquivalentKg != null
                    ? massKgToGrams(
                        advancedCalc.totalJuiceEquivalentKg,
                      ).toFixed(1)
                    : "—"}
                </span>
              </p>
              <p>
                Total Juice Content (%):{" "}
                <span className="font-semibold">
                  {advancedCalc?.totalJuicePercent != null
                    ? advancedCalc.totalJuicePercent.toFixed(1)
                    : "—"}
                </span>
              </p>
              <p>
                Total Cost (EUR):{" "}
                <span className="font-semibold">
                  {advancedCalc?.totalCostEur != null
                    ? advancedCalc.totalCostEur.toFixed(3)
                    : "—"}
                </span>
              </p>
              <p>
                Final Batch Weight (g):{" "}
                <span className="font-semibold">
                  {advancedCalc?.finalMassKg != null
                    ? massKgToGrams(advancedCalc.finalMassKg).toFixed(1)
                    : "—"}
                </span>
              </p>
              <p>
                {advancedCalc?.costPerLiterEur != null
                  ? "Cost per L"
                  : "Cost per kg"}
                :{" "}
                <span className="font-semibold">
                  {advancedCalc?.costPerLiterEur != null
                    ? advancedCalc.costPerLiterEur.toFixed(3)
                    : advancedCalc?.costPerKgEur != null
                      ? advancedCalc.costPerKgEur.toFixed(3)
                      : "—"}
                </span>
              </p>
            </div>

            <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3">
              <h4 className="text-sm font-semibold text-blue-900">
                Totals & adjustments
              </h4>
              <div className="mt-2 grid gap-2 text-xs text-blue-900 md:grid-cols-2">
                <p>
                  Water to top-up:{" "}
                  <span className="font-semibold">
                    {specsCalc
                      ? specsCalc.suggestions.waterToAddL.toFixed(3)
                      : "—"}{" "}
                    L
                  </span>
                </p>
                <p>
                  Water mass:{" "}
                  <span className="font-semibold">
                    {specsCalc
                      ? massKgToGrams(
                          specsCalc.suggestions.waterToAddKg,
                        ).toFixed(1)
                      : "—"}{" "}
                    g
                  </span>
                </p>
                <p>
                  Suggested sugar:{" "}
                  <span className="font-semibold">
                    {specsCalc
                      ? massKgToGrams(
                          specsCalc.suggestions.sugarKg ?? 0,
                        ).toFixed(1)
                      : "—"}{" "}
                    g
                  </span>
                </p>
                <p>
                  Suggested citric acid:{" "}
                  <span className="font-semibold">
                    {specsCalc?.suggestions.citricKg != null
                      ? massKgToGrams(specsCalc.suggestions.citricKg).toFixed(1)
                      : "—"}{" "}
                    g
                  </span>
                </p>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applySugarSuggestion}
                  disabled={!specsCalc || !suggestedSugarIngredient}
                  className="rounded border border-blue-200 bg-white px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  Apply sugar suggestion
                </button>
                <button
                  type="button"
                  onClick={applyCitricSuggestion}
                  disabled={!specsCalc || !suggestedCitricIngredient}
                  className="rounded border border-blue-200 bg-white px-2 py-1 text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                >
                  Apply citric suggestion
                </button>
              </div>
            </div>

            {!advancedCalc ? (
              <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Calculated results appear after you set a valid{" "}
                <strong>Final volume</strong>
                and add ingredient rows from the dropdown list.
              </p>
            ) : null}

            {advancedCalc?.warnings.length ? (
              <ul className="mt-3 space-y-1 text-xs text-amber-700">
                {advancedCalc.warnings.map((warning) => (
                  <li key={warning}>• {warning}</li>
                ))}
              </ul>
            ) : null}

            {advancedCalc?.breakdown.length ? (
              <div className="mt-4 overflow-x-auto rounded-md border border-blue-100 bg-white">
                <table className="min-w-325 text-xs">
                  <thead className="bg-blue-50 text-left text-slate-700">
                    <tr>
                      <th className="px-2 py-1">Ingredient</th>
                      <th className="px-2 py-1">Dosage</th>
                      <th className="px-2 py-1">Mass (g)</th>
                      <th className="px-2 py-1">Density</th>
                      <th className="px-2 py-1">Volume (L)</th>
                      <th className="px-2 py-1">Brix %</th>
                      <th className="px-2 py-1">Solids (g)</th>
                      <th className="px-2 py-1">Acidity %</th>
                      <th className="px-2 py-1">Acid (g)</th>
                      <th className="px-2 py-1">Juice Eq (g)</th>
                      <th className="px-2 py-1">Price/kg EUR</th>
                      <th className="px-2 py-1">Line Cost EUR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advancedCalc.breakdown.map((line, idx) => (
                      <tr
                        key={`${line.ingredientName}-${idx}`}
                        className="border-t border-blue-100"
                      >
                        <td className="px-2 py-1">{line.ingredientName}</td>
                        <td className="px-2 py-1">
                          {line.dosageValue} {line.dosageUnit}
                        </td>
                        <td className="px-2 py-1">
                          {line.massKg != null &&
                          Number.isFinite(Number(line.massKg))
                            ? massKgToGrams(Number(line.massKg)).toFixed(1)
                            : "—"}
                        </td>
                        <td className="px-2 py-1">
                          {line.densityKgPerL ?? "—"}
                        </td>
                        <td className="px-2 py-1">{line.volumeL ?? "—"}</td>
                        <td className="px-2 py-1">
                          {line.brixPercent ?? "no data"}
                        </td>
                        <td className="px-2 py-1">
                          {line.solidsContributionKg != null &&
                          Number.isFinite(Number(line.solidsContributionKg))
                            ? massKgToGrams(
                                Number(line.solidsContributionKg),
                              ).toFixed(1)
                            : "—"}
                        </td>
                        <td className="px-2 py-1">
                          {line.titratableAcidityPercent ?? "no data"}
                        </td>
                        <td className="px-2 py-1">
                          {line.acidContributionKg != null &&
                          Number.isFinite(Number(line.acidContributionKg))
                            ? massKgToGrams(
                                Number(line.acidContributionKg),
                              ).toFixed(1)
                            : "—"}
                        </td>
                        <td className="px-2 py-1">
                          {line.juiceEquivalentKg != null &&
                          Number.isFinite(Number(line.juiceEquivalentKg))
                            ? massKgToGrams(
                                Number(line.juiceEquivalentKg),
                              ).toFixed(1)
                            : "—"}
                        </td>
                        <td className="px-2 py-1">
                          {line.pricePerKgEur ?? "—"}
                        </td>
                        <td className="px-2 py-1">{line.lineCostEur ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          {editingId ? (
            <button
              onClick={cancelEditFormulation}
              disabled={saving || autosaving}
              className="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel edit
            </button>
          ) : null}
          <button
            onClick={() => {
              void submitForm();
            }}
            disabled={!isValid || saving || autosaving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {saving
              ? "Saving..."
              : autosaving
                ? "Autosaving..."
                : editingId
                  ? "Update formulation"
                  : "Create formulation"}
          </button>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Batch Calculation (after 1L formula is saved)
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          This section scales the last saved 1L formulation to any batch size.
        </p>

        {!savedForBatch ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Save the 1L formulation first, then batch scaling appears here.
          </p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-[220px_1fr]">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Batch size (L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={batchLiters}
                  onChange={(e) => setBatchLiters(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="self-end text-sm text-gray-700">
                Scaling formula:{" "}
                <span className="font-semibold">
                  1L × {batchLitersValue ?? "—"}
                </span>
              </div>
            </div>

            {batchLitersValue == null ? (
              <p className="mt-3 text-xs text-red-600">
                Enter a valid batch size in liters.
              </p>
            ) : (
              <>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                    <p className="text-xs uppercase tracking-wide text-blue-700">
                      Total Cost
                    </p>
                    <p className="mt-1 font-semibold">
                      {batchSummary.scaledTotalCostEur != null
                        ? `${batchSummary.scaledTotalCostEur.toFixed(3)} EUR`
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                    <p className="text-xs uppercase tracking-wide text-blue-700">
                      Water Top-up (L)
                    </p>
                    <p className="mt-1 font-semibold">
                      {batchSummary.scaledWaterTopUpL != null
                        ? `${batchSummary.scaledWaterTopUpL.toFixed(3)} L`
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto rounded-md border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-700">
                      <tr>
                        <th className="px-3 py-2">Ingredient</th>
                        <th className="px-3 py-2">1L Amount (kg)</th>
                        <th className="px-3 py-2">Scaled Amount (kg)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchScaleRows.map((row) => (
                        <tr key={row.id} className="border-t border-gray-100">
                          <td className="px-3 py-2">{row.ingredientName}</td>
                          <td className="px-3 py-2">
                            {row.baseAmount.toFixed(4)} {row.unit}
                          </td>
                          <td className="px-3 py-2 font-semibold text-blue-900">
                            {row.scaledAmount.toFixed(4)} {row.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
