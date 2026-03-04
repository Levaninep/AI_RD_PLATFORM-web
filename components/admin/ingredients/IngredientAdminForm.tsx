"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { applyAutoSync } from "@/lib/physchem/autoSync";
import type { AdminIngredient } from "@/components/admin/ingredients/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categories = ["Sweetener", "Juice", "Acid", "Flavor", "Extract", "Other"];

type Props = {
  mode: "create" | "edit";
  initialData?: AdminIngredient | null;
};

type FieldErrors = Record<string, string>;

type FormState = {
  ingredientName: string;
  category: string;
  supplier: string;
  countryOfOrigin: string;
  pricePerKgEur: string;
  densityKgPerL: string;
  brixPercent: string;
  singleStrengthBrix: string;
  titratableAcidityPercent: string;
  pH: string;
  waterContentPercent: string;
  shelfLifeMonths: string;
  storageConditions: string;
  allergenInfo: string;
  vegan: boolean;
  natural: boolean;
  co2SolubilityRelevant: boolean;
  notes: string;
  autoCalculate: boolean;
  lastEditedField: "brix" | "density" | null;
};

function nullableNumber(value: string): number | undefined {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toInitialState(data?: AdminIngredient | null): FormState {
  return {
    ingredientName: data?.ingredientName ?? "",
    category: data?.category ?? "Other",
    supplier: data?.supplier ?? "",
    countryOfOrigin: data?.countryOfOrigin ?? "",
    pricePerKgEur:
      data?.pricePerKgEur != null ? String(data.pricePerKgEur) : "",
    densityKgPerL:
      data?.densityKgPerL != null ? String(data.densityKgPerL) : "",
    brixPercent: data?.brixPercent != null ? String(data.brixPercent) : "",
    singleStrengthBrix:
      data?.singleStrengthBrix != null ? String(data.singleStrengthBrix) : "",
    titratableAcidityPercent:
      data?.titratableAcidityPercent != null
        ? String(data.titratableAcidityPercent)
        : "",
    pH: data?.pH != null ? String(data.pH) : "",
    waterContentPercent:
      data?.waterContentPercent != null ? String(data.waterContentPercent) : "",
    shelfLifeMonths:
      data?.shelfLifeMonths != null ? String(data.shelfLifeMonths) : "",
    storageConditions: data?.storageConditions ?? "",
    allergenInfo: data?.allergenInfo ?? "",
    vegan: data?.vegan ?? false,
    natural: data?.natural ?? false,
    co2SolubilityRelevant: data?.co2SolubilityRelevant ?? false,
    notes: data?.notes ?? "",
    autoCalculate: true,
    lastEditedField: null,
  };
}

export default function IngredientAdminForm({ mode, initialData }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toInitialState(initialData));
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const pageTitle = mode === "create" ? "New Ingredient" : "Edit Ingredient";

  const metadata = useMemo(() => {
    if (!initialData) return null;
    return {
      createdAt: new Date(initialData.createdAt).toLocaleString(),
      updatedAt: new Date(initialData.updatedAt).toLocaleString(),
    };
  }, [initialData]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateBrixOrDensity(
    editedField: "brix" | "density",
    nextRawValue: string,
  ) {
    setForm((prev) => {
      const next = applyAutoSync({
        state: {
          brixPercent: prev.brixPercent,
          densityKgPerL: prev.densityKgPerL,
          lastEditedField: prev.lastEditedField,
        },
        editedField,
        nextRawValue,
        autoCalculate: prev.autoCalculate,
      });

      return {
        ...prev,
        ...next,
      };
    });
  }

  function buildPayload() {
    return {
      ingredientName: form.ingredientName,
      category: form.category,
      supplier: form.supplier,
      countryOfOrigin: form.countryOfOrigin,
      pricePerKgEur: Number(form.pricePerKgEur),
      densityKgPerL: nullableNumber(form.densityKgPerL),
      brixPercent: nullableNumber(form.brixPercent),
      singleStrengthBrix: nullableNumber(form.singleStrengthBrix),
      titratableAcidityPercent: nullableNumber(form.titratableAcidityPercent),
      pH: nullableNumber(form.pH),
      waterContentPercent: nullableNumber(form.waterContentPercent),
      shelfLifeMonths: nullableNumber(form.shelfLifeMonths),
      storageConditions: form.storageConditions.trim() || undefined,
      allergenInfo: form.allergenInfo.trim() || undefined,
      vegan: form.vegan,
      natural: form.natural,
      co2SolubilityRelevant: form.co2SolubilityRelevant,
      notes: form.notes.trim() || undefined,
    };
  }

  async function submit(target: "back" | "new") {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    try {
      const url =
        mode === "create"
          ? "/api/admin/ingredients"
          : `/api/admin/ingredients/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const issues = Array.isArray(data?.error?.issues)
          ? data.error.issues
          : [];
        const nextErrors: FieldErrors = {};
        for (const issue of issues) {
          const key = Array.isArray(issue?.path)
            ? String(issue.path[0] ?? "")
            : "";
          if (key && !nextErrors[key]) {
            nextErrors[key] = String(issue.message ?? "Invalid value");
          }
        }
        setFieldErrors(nextErrors);
        throw new Error(data?.error?.message ?? "Save failed.");
      }

      setToast(
        mode === "create" ? "Ingredient created." : "Ingredient updated.",
      );

      if (target === "new") {
        setForm(toInitialState(null));
        router.replace("/admin/ingredients/new");
        return;
      }

      router.push("/admin/ingredients");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Save failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteIngredient() {
    if (!initialData) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/ingredients/${initialData.id}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error?.message ?? "Delete failed.");
      }

      setDeleteOpen(false);
      router.push("/admin/ingredients");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Delete failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-600">Admin · Ingredients</p>
          </div>
          <Link
            href="/admin/ingredients"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Back to list
          </Link>
        </div>

        {toast ? (
          <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {toast}
          </div>
        ) : null}
        {error ? (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mb-5 rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            A) Identity & Supply
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Ingredient Name *
              </label>
              <input
                value={form.ingredientName}
                onChange={(event) =>
                  updateField("ingredientName", event.target.value)
                }
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
              {fieldErrors.ingredientName ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.ingredientName}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Supplier *
              </label>
              <input
                value={form.supplier}
                onChange={(event) =>
                  updateField("supplier", event.target.value)
                }
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
              {fieldErrors.supplier ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.supplier}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Country of Origin *
              </label>
              <input
                value={form.countryOfOrigin}
                onChange={(event) =>
                  updateField("countryOfOrigin", event.target.value)
                }
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
              {fieldErrors.countryOfOrigin ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.countryOfOrigin}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            B) Commercial
          </h2>
          <div className="mt-3 max-w-sm">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Price per kg (EUR) *
            </label>
            <input
              value={form.pricePerKgEur}
              onChange={(event) =>
                updateField("pricePerKgEur", event.target.value)
              }
              inputMode="decimal"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
            />
            {fieldErrors.pricePerKgEur ? (
              <p className="mt-1 text-xs text-red-600">
                {fieldErrors.pricePerKgEur}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mb-5 rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            C) Physicochemical Specs
          </h2>
          <div className="mt-3 mb-2 flex items-center gap-2 text-sm">
            <input
              id="auto-sync"
              type="checkbox"
              checked={form.autoCalculate}
              onChange={(event) =>
                updateField("autoCalculate", event.target.checked)
              }
            />
            <label htmlFor="auto-sync" className="text-slate-700">
              Auto-calculate Brix/Density
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Brix (%)
              </label>
              <input
                value={form.brixPercent}
                onChange={(event) =>
                  updateBrixOrDensity("brix", event.target.value)
                }
                inputMode="decimal"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
              {fieldErrors.brixPercent ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.brixPercent}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Density (kg/L)
              </label>
              <input
                value={form.densityKgPerL}
                onChange={(event) =>
                  updateBrixOrDensity("density", event.target.value)
                }
                inputMode="decimal"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
              {fieldErrors.densityKgPerL ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.densityKgPerL}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Titratable Acidity (%)
              </label>
              <input
                value={form.titratableAcidityPercent}
                onChange={(event) =>
                  updateField("titratableAcidityPercent", event.target.value)
                }
                inputMode="decimal"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Single Strength Brix (%)
              </label>
              <input
                value={form.singleStrengthBrix}
                onChange={(event) =>
                  updateField("singleStrengthBrix", event.target.value)
                }
                inputMode="decimal"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
              {fieldErrors.singleStrengthBrix ? (
                <p className="mt-1 text-xs text-red-600">
                  {fieldErrors.singleStrengthBrix}
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                pH
              </label>
              <input
                value={form.pH}
                onChange={(event) => updateField("pH", event.target.value)}
                inputMode="decimal"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Water Content (%)
              </label>
              <input
                value={form.waterContentPercent}
                onChange={(event) =>
                  updateField("waterContentPercent", event.target.value)
                }
                inputMode="decimal"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.co2SolubilityRelevant}
                  onChange={(event) =>
                    updateField("co2SolubilityRelevant", event.target.checked)
                  }
                />
                CO₂ Solubility Relevant
              </label>
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            D) Storage & Regulatory
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Shelf-life (months)
              </label>
              <input
                value={form.shelfLifeMonths}
                onChange={(event) =>
                  updateField("shelfLifeMonths", event.target.value)
                }
                inputMode="numeric"
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end gap-4 pb-2">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.vegan}
                  onChange={(event) =>
                    updateField("vegan", event.target.checked)
                  }
                />
                Vegan
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.natural}
                  onChange={(event) =>
                    updateField("natural", event.target.checked)
                  }
                />
                Natural
              </label>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Storage Conditions
              </label>
              <textarea
                value={form.storageConditions}
                onChange={(event) =>
                  updateField("storageConditions", event.target.value)
                }
                className="h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Allergen Info
              </label>
              <textarea
                value={form.allergenInfo}
                onChange={(event) =>
                  updateField("allergenInfo", event.target.value)
                }
                className="h-24 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            E) Notes
          </h2>
          <textarea
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            className="mt-3 h-28 w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </section>

        {metadata ? (
          <section className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p>Created: {metadata.createdAt}</p>
            <p className="mt-1">Updated: {metadata.updatedAt}</p>
          </section>
        ) : null}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void submit("back")}
              disabled={submitting}
              className="rounded bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => void submit("new")}
              disabled={submitting}
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Save & New
            </button>
            <Link
              href="/admin/ingredients"
              className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>

          {mode === "edit" ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          ) : null}
        </footer>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ingredient</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. If this ingredient is used in
              formulations, deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void deleteIngredient()}
              disabled={submitting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
