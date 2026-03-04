"use client";

import { useMemo, useState } from "react";
import type { Ingredient } from "@/lib/types";
import { applyAutoSync } from "@/lib/physchem/autoSync";

type IngredientFormPayload = {
  ingredientName: string;
  category: Ingredient["category"];
  supplier: string;
  countryOfOrigin: string;
  pricePerKgEur: number;
  densityKgPerL: number | null;
  brixPercent: number | null;
  singleStrengthBrix: number | null;
  brixDensityTempC?: number | null;
  titratableAcidityPercent: number | null;
  pH: number | null;
  waterContentPercent: number | null;
  co2SolubilityRelevant: boolean;
  shelfLifeMonths: number | null;
  storageConditions: string | null;
  allergenInfo: string | null;
  vegan: boolean;
  natural: boolean;
  notes: string | null;
  coaFileUrl: string | null;
  overrideThisIngredient?: boolean;
  autoCalculate?: boolean;
};

type IngredientFormModalProps = {
  open: boolean;
  busy: boolean;
  ingredient: Ingredient | null;
  categories: readonly Ingredient["category"][];
  onClose: () => void;
  onResetOverride?: () => Promise<void>;
  onSubmit: (payload: IngredientFormPayload) => Promise<void>;
};

type FormValues = Record<keyof IngredientFormPayload, string | boolean>;

function toText(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function parseOptionalNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function defaults(ingredient: Ingredient | null): FormValues {
  return {
    ingredientName: ingredient?.ingredientName ?? "",
    category: ingredient?.category ?? "Other",
    supplier: ingredient?.supplier ?? "",
    countryOfOrigin: ingredient?.countryOfOrigin ?? "",
    pricePerKgEur: toText(ingredient?.pricePerKgEur ?? ingredient?.pricePerKg),
    densityKgPerL: toText(ingredient?.densityKgPerL ?? ingredient?.density),
    brixPercent: toText(ingredient?.brixPercent ?? ingredient?.brix),
    singleStrengthBrix: toText(ingredient?.singleStrengthBrix),
    brixDensityTempC: toText(ingredient?.brixDensityTempC ?? 20),
    titratableAcidityPercent: toText(
      ingredient?.titratableAcidityPercent ?? ingredient?.titratableAcidity,
    ),
    pH: toText(ingredient?.pH),
    waterContentPercent: toText(
      ingredient?.waterContentPercent ?? ingredient?.waterContent,
    ),
    co2SolubilityRelevant: ingredient?.co2SolubilityRelevant ?? false,
    shelfLifeMonths: toText(ingredient?.shelfLifeMonths),
    storageConditions: ingredient?.storageConditions ?? "",
    allergenInfo: ingredient?.allergenInfo ?? "",
    vegan: ingredient?.vegan ?? false,
    natural: ingredient?.natural ?? false,
    notes: ingredient?.notes ?? "",
    coaFileUrl: ingredient?.coaFileUrl ?? "",
    overrideThisIngredient: false,
    autoCalculate: true,
  };
}

export default function IngredientFormModal({
  open,
  busy,
  ingredient,
  categories,
  onClose,
  onResetOverride,
  onSubmit,
}: IngredientFormModalProps) {
  const [form, setForm] = useState<FormValues>(defaults(ingredient));
  const [error, setError] = useState<string | null>(null);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [overrideThisIngredient, setOverrideThisIngredient] = useState(false);

  const title = useMemo(
    () => (ingredient ? "Edit Ingredient" : "Create Ingredient"),
    [ingredient],
  );

  if (!open) {
    return null;
  }

  async function submit() {
    const pricePerKg = Number(
      String(form.pricePerKgEur).trim().replace(",", "."),
    );
    if (
      !String(form.ingredientName).trim() ||
      String(form.ingredientName).trim().length < 2
    ) {
      setError("Ingredient Name must be at least 2 characters.");
      return;
    }

    if (!String(form.supplier).trim()) {
      setError("Supplier is required.");
      return;
    }

    if (!String(form.countryOfOrigin).trim()) {
      setError("Country of origin is required.");
      return;
    }

    if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
      setError("Price per kg must be a number >= 0.");
      return;
    }

    const density = parseOptionalNumber(String(form.densityKgPerL));
    const brix = parseOptionalNumber(String(form.brixPercent));
    const singleStrengthBrix = parseOptionalNumber(
      String(form.singleStrengthBrix),
    );
    const titratableAcidity = parseOptionalNumber(
      String(form.titratableAcidityPercent),
    );
    const pH = parseOptionalNumber(String(form.pH));
    const waterContent = parseOptionalNumber(String(form.waterContentPercent));
    const shelfLifeMonths = parseOptionalNumber(String(form.shelfLifeMonths));

    if (
      density != null &&
      (!Number.isFinite(density) || density < 0.98 || density > 1.45)
    ) {
      setError("Density must be between 0.98 and 1.45 when provided.");
      return;
    }

    if (brix != null && (!Number.isFinite(brix) || brix < 0 || brix > 85)) {
      setError("Brix must be between 0 and 85.");
      return;
    }

    if (
      singleStrengthBrix != null &&
      (!Number.isFinite(singleStrengthBrix) ||
        singleStrengthBrix < 0 ||
        singleStrengthBrix > 85)
    ) {
      setError("Single-strength Brix must be between 0 and 85.");
      return;
    }

    if (
      titratableAcidity != null &&
      (!Number.isFinite(titratableAcidity) || titratableAcidity < 0)
    ) {
      setError("Titratable acidity must be >= 0.");
      return;
    }

    if (pH != null && (!Number.isFinite(pH) || pH < 0 || pH > 14)) {
      setError("pH must be between 0 and 14.");
      return;
    }

    if (
      waterContent != null &&
      (!Number.isFinite(waterContent) || waterContent < 0 || waterContent > 100)
    ) {
      setError("Water content must be between 0 and 100.");
      return;
    }

    if (
      shelfLifeMonths != null &&
      (!Number.isFinite(shelfLifeMonths) || shelfLifeMonths < 0)
    ) {
      setError("Shelf-life months must be >= 0.");
      return;
    }

    const brixDensityTempC = parseOptionalNumber(String(form.brixDensityTempC));

    try {
      setError(null);
      await onSubmit({
        ingredientName: String(form.ingredientName).trim(),
        category: form.category as Ingredient["category"],
        supplier: String(form.supplier).trim(),
        countryOfOrigin: String(form.countryOfOrigin).trim(),
        pricePerKgEur: pricePerKg,
        densityKgPerL: density,
        brixPercent: brix,
        singleStrengthBrix,
        brixDensityTempC: brixDensityTempC ?? 20,
        titratableAcidityPercent: titratableAcidity,
        pH,
        waterContentPercent: waterContent,
        co2SolubilityRelevant: Boolean(form.co2SolubilityRelevant),
        shelfLifeMonths:
          shelfLifeMonths == null ? null : Math.round(shelfLifeMonths),
        storageConditions: String(form.storageConditions).trim() || null,
        allergenInfo: String(form.allergenInfo).trim() || null,
        vegan: Boolean(form.vegan),
        natural: Boolean(form.natural),
        notes: String(form.notes).trim() || null,
        coaFileUrl: String(form.coaFileUrl).trim() || null,
        overrideThisIngredient,
        autoCalculate,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Save failed.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 border-b border-blue-100 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">
            Commercial and R&D-ready ingredient data
          </p>
        </div>

        {error ? (
          <div className="mx-6 mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-6 p-6">
          <section className="rounded-lg border border-blue-100 p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-700">
              Section 1 · Commercial Data
            </h3>
            <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoCalculate}
                  onChange={(e) => setAutoCalculate(e.target.checked)}
                />
                Auto-calculate Brix ↔ Density
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={overrideThisIngredient}
                  onChange={(e) => setOverrideThisIngredient(e.target.checked)}
                  disabled={!ingredient}
                />
                Override this ingredient’s parameters
              </label>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Ingredient Name"
                value={String(form.ingredientName)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    ingredientName: e.target.value,
                  }))
                }
              />
              <select
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                value={String(form.category)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value as Ingredient["category"],
                  }))
                }
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Supplier"
                value={String(form.supplier)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, supplier: e.target.value }))
                }
              />
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Country of Origin"
                value={String(form.countryOfOrigin)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    countryOfOrigin: e.target.value,
                  }))
                }
              />
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Price per kg"
                inputMode="decimal"
                value={String(form.pricePerKgEur)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    pricePerKgEur: e.target.value,
                  }))
                }
              />
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Density (kg/L)"
                inputMode="decimal"
                value={String(form.densityKgPerL)}
                onChange={(e) => {
                  const densityText = e.target.value;
                  setForm((prev) => {
                    const next = applyAutoSync({
                      state: {
                        brixPercent: String(prev.brixPercent),
                        densityKgPerL: String(prev.densityKgPerL),
                        lastEditedField: null,
                      },
                      editedField: "density",
                      nextRawValue: densityText,
                      autoCalculate,
                    });
                    return {
                      ...prev,
                      densityKgPerL: next.densityKgPerL,
                      brixPercent: next.brixPercent,
                    };
                  });
                }}
              />
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Brix/Density Temp (°C)"
                inputMode="decimal"
                value={String(form.brixDensityTempC)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    brixDensityTempC: e.target.value,
                  }))
                }
              />
            </div>
          </section>

          <section className="rounded-lg border border-blue-100 p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-700">
              Section 2 · Technological Parameters
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <input
                title="Brix: soluble solids percentage contribution to final blend."
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Brix (0-85)"
                inputMode="decimal"
                value={String(form.brixPercent)}
                onChange={(e) => {
                  const brixText = e.target.value;
                  setForm((prev) => {
                    const next = applyAutoSync({
                      state: {
                        brixPercent: String(prev.brixPercent),
                        densityKgPerL: String(prev.densityKgPerL),
                        lastEditedField: null,
                      },
                      editedField: "brix",
                      nextRawValue: brixText,
                      autoCalculate,
                    });
                    return {
                      ...prev,
                      brixPercent: next.brixPercent,
                      densityKgPerL: next.densityKgPerL,
                    };
                  });
                }}
              />
              <div className="text-xs text-slate-500">
                Source:{" "}
                {ingredient?.valueSources?.brixPercent === "overridden"
                  ? "Overridden"
                  : "Database"}
              </div>
              <div className="text-xs text-slate-500">
                Source:{" "}
                {ingredient?.valueSources?.densityKgPerL === "overridden"
                  ? "Overridden"
                  : "Database"}
              </div>
              <input
                title="Single-strength Brix: juice standard equivalent used for juice content calculations."
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Single Strength Brix"
                inputMode="decimal"
                value={String(form.singleStrengthBrix)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    singleStrengthBrix: e.target.value,
                  }))
                }
              />
              <input
                title="Titratable Acidity: acid contribution used in juice standardization."
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Titratable Acidity"
                inputMode="decimal"
                value={String(form.titratableAcidityPercent)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    titratableAcidityPercent: e.target.value,
                  }))
                }
              />
              <input
                title="pH: measure of acidity/basicity, valid range 0-14."
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="pH (0-14)"
                inputMode="decimal"
                value={String(form.pH)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, pH: e.target.value }))
                }
              />
              <input
                title="Water content: used for water-balance and dilution correction."
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Water Content (%)"
                inputMode="decimal"
                value={String(form.waterContentPercent)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    waterContentPercent: e.target.value,
                  }))
                }
              />
              <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(form.co2SolubilityRelevant)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      co2SolubilityRelevant: e.target.checked,
                    }))
                  }
                />
                CO₂ Solubility Relevant
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-blue-100 p-4">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-700">
              Section 3 · Stability & Regulatory
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Shelf-life (months)"
                inputMode="numeric"
                value={String(form.shelfLifeMonths)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    shelfLifeMonths: e.target.value,
                  }))
                }
              />
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Storage Conditions"
                value={String(form.storageConditions)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    storageConditions: e.target.value,
                  }))
                }
              />
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Allergen Info"
                value={String(form.allergenInfo)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, allergenInfo: e.target.value }))
                }
              />
              <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(form.vegan)}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, vegan: e.target.checked }))
                  }
                />
                Vegan
              </label>
              <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(form.natural)}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, natural: e.target.checked }))
                  }
                />
                Natural
              </label>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="COA file URL placeholder"
                value={String(form.coaFileUrl)}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, coaFileUrl: e.target.value }))
                }
              />
            </div>
            <textarea
              className="mt-4 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Notes"
              value={String(form.notes)}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </section>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-blue-100 bg-white px-6 py-4">
          {ingredient?.effectiveOverrideId ? (
            <button
              className="rounded-md border border-amber-300 px-4 py-2 text-sm text-amber-700"
              onClick={() => {
                void onResetOverride?.();
              }}
              disabled={busy}
            >
              Reset to database
            </button>
          ) : null}
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            onClick={submit}
            disabled={busy}
          >
            {busy ? "Saving..." : "Save Ingredient"}
          </button>
        </div>
      </div>
    </div>
  );
}
