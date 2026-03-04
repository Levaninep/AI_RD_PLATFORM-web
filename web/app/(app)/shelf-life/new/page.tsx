"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CONDITION_TYPES,
  PLANNED_SHELF_LIFE_OPTIONS,
  PACKAGING_TYPES,
  addDays,
  computeQ10Rate,
  generateSamplingPlan,
} from "@/lib/shelf-life";
import type { ApiErrorResponse, Formulation } from "@/lib/types";

type FormulationOption = {
  id: string;
  name: string;
};

type MaterialItem = {
  ingredientName: string;
  quantity: string;
  unit: string;
};

type WizardState = {
  productName: string;
  formulationId: string;
  packagingType: (typeof PACKAGING_TYPES)[number];
  packVolumeL: string;
  carbonated: boolean;
  co2AtFilling: string;
  plannedShelfLifeDays: (typeof PLANNED_SHELF_LIFE_OPTIONS)[number];
  marketRequirements: string;
  startDate: string;
  responsiblePerson: string;
  createdBy: string;
  selectedConditions: (typeof CONDITION_TYPES)[number][];
  includePetPackagingChangeCase: boolean;
  reserveCoefficientEnabled: boolean;
  notes: string;
  materialsSupplier: string;
  materialsTerms: string;
  materialItems: MaterialItem[];
};

function initialState(): WizardState {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  return {
    productName: "",
    formulationId: "",
    packagingType: "PET",
    packVolumeL: "0.5",
    carbonated: true,
    co2AtFilling: "5.0",
    plannedShelfLifeDays: 365,
    marketRequirements: "",
    startDate: `${yyyy}-${mm}-${dd}`,
    responsiblePerson: "",
    createdBy: "",
    selectedConditions: ["REAL_TIME", "ACCELERATED"],
    includePetPackagingChangeCase: false,
    reserveCoefficientEnabled: true,
    notes: "",
    materialsSupplier: "",
    materialsTerms: "",
    materialItems: [{ ingredientName: "", quantity: "", unit: "kg" }],
  };
}

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function toIsoDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

const STEPS = [
  "Product & packaging",
  "Test design & conditions",
  "Execution & sampling",
  "Results setup",
  "Conclusions",
] as const;

export default function NewShelfLifeWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [q10R1, setQ10R1] = useState("365");
  const [q10T1, setQ10T1] = useState("25");
  const [q10T2, setQ10T2] = useState("40");
  const [q10Value, setQ10Value] = useState("2.5");

  const [formulations, setFormulations] = useState<FormulationOption[]>([]);

  useEffect(() => {
    let active = true;

    async function loadFormulations() {
      try {
        const response = await fetch("/api/formulations", {
          cache: "no-store",
        });
        const data = await readJsonSafe<Formulation[] | ApiErrorResponse>(
          response,
        );

        if (!response.ok) {
          return;
        }

        const options = ((data as Formulation[] | null) ?? []).map((item) => ({
          id: item.id,
          name: item.name,
        }));

        if (active) {
          setFormulations(options);
        }
      } catch {}
    }

    void loadFormulations();

    return () => {
      active = false;
    };
  }, []);

  const plan = useMemo(() => {
    const packVolume = Number(state.packVolumeL);
    if (!Number.isFinite(packVolume) || packVolume <= 0) {
      return [];
    }

    return generateSamplingPlan({
      plannedShelfLifeDays: state.plannedShelfLifeDays,
      packagingType: state.packagingType,
      packVolumeL: packVolume,
      selectedConditions: state.selectedConditions,
      includePetPackagingChangeCase: state.includePetPackagingChangeCase,
      reserveCoefficient: state.reserveCoefficientEnabled ? 1.15 : 1,
    });
  }, [state]);

  const totals = useMemo(() => {
    return plan.reduce(
      (sum, event) => {
        sum.packs += event.requiredPacks;
        sum.liters += event.requiredLiters;
        return sum;
      },
      { packs: 0, liters: 0 },
    );
  }, [plan]);

  const q10Result = useMemo(() => {
    const r1 = Number(q10R1);
    const t1 = Number(q10T1);
    const t2 = Number(q10T2);
    const q10 = Number(q10Value);

    if (![r1, t1, t2, q10].every(Number.isFinite) || q10 < 2 || q10 > 3) {
      return null;
    }

    return {
      r2: computeQ10Rate({ r1, t1, t2, q10 }),
      reserve: r1 * 1.15,
    };
  }, [q10R1, q10T1, q10T2, q10Value]);

  function updateField<K extends keyof WizardState>(
    key: K,
    value: WizardState[K],
  ) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCondition(condition: (typeof CONDITION_TYPES)[number]) {
    setState((prev) => {
      const exists = prev.selectedConditions.includes(condition);
      const next = exists
        ? prev.selectedConditions.filter((item) => item !== condition)
        : [...prev.selectedConditions, condition];

      return {
        ...prev,
        selectedConditions: next.length > 0 ? next : ["REAL_TIME"],
      };
    });
  }

  function updateMaterial(index: number, patch: Partial<MaterialItem>) {
    setState((prev) => ({
      ...prev,
      materialItems: prev.materialItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addMaterialRow() {
    setState((prev) => ({
      ...prev,
      materialItems: [
        ...prev.materialItems,
        { ingredientName: "", quantity: "", unit: "kg" },
      ],
    }));
  }

  function removeMaterialRow(index: number) {
    setState((prev) => ({
      ...prev,
      materialItems: prev.materialItems.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  }

  async function handleCreate() {
    setError(null);

    if (state.productName.trim().length < 2) {
      setError("Product name must be at least 2 characters.");
      return;
    }

    const packVolumeL = Number(state.packVolumeL);
    if (!Number.isFinite(packVolumeL) || packVolumeL <= 0) {
      setError("Pack volume must be a positive number.");
      return;
    }

    if (state.carbonated) {
      const c0 = Number(state.co2AtFilling);
      if (!Number.isFinite(c0) || c0 <= 0) {
        setError("CO2 at filling is required and must be positive.");
        return;
      }
    }

    try {
      setSaving(true);

      const response = await fetch("/api/shelf-life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: state.productName.trim(),
          formulationId: state.formulationId || null,
          packagingType: state.packagingType,
          packVolumeL,
          carbonated: state.carbonated,
          co2AtFilling: state.carbonated ? Number(state.co2AtFilling) : null,
          plannedShelfLifeDays: state.plannedShelfLifeDays,
          startDate: toIsoDate(state.startDate),
          selectedConditions: state.selectedConditions,
          includePetPackagingChangeCase: state.includePetPackagingChangeCase,
          reserveCoefficientEnabled: state.reserveCoefficientEnabled,
          marketRequirements: state.marketRequirements || null,
          responsiblePerson: state.responsiblePerson || null,
          createdBy: state.createdBy || null,
          notes: state.notes || null,
          materialsRequest: {
            supplier: state.materialsSupplier || null,
            terms: state.materialsTerms || null,
            items: state.materialItems
              .filter((item) => item.ingredientName.trim())
              .map((item) => ({
                ingredientName: item.ingredientName.trim(),
                quantity: Number(item.quantity),
                unit: item.unit.trim() || "kg",
              }))
              .filter(
                (item) => Number.isFinite(item.quantity) && item.quantity > 0,
              ),
          },
        }),
      });

      const data = await readJsonSafe<{ id: string } | ApiErrorResponse>(
        response,
      );

      if (!response.ok) {
        throw new Error(
          (data as ApiErrorResponse | null)?.error?.message ||
            `Failed to create shelf-life test (HTTP ${response.status}).`,
        );
      }

      const id = (data as { id: string }).id;
      router.push(`/shelf-life/${id}`);
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create test.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Create Shelf-Life Test
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Follow procedure-aligned steps to plan test conditions, sampling,
            and documentation.
          </p>
        </div>
        <Link
          href="/shelf-life"
          className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Back to list
        </Link>
      </div>

      <div className="mt-4 grid gap-2 rounded-lg border border-gray-200 bg-white p-3 md:grid-cols-5">
        {STEPS.map((label, index) => {
          const current = index + 1;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setStep(current)}
              className={`rounded-md border px-2 py-2 text-left text-xs ${
                step === current
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="block font-semibold">Step {current}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {step === 1 ? (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">
            1) Product & packaging
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Product name
              </label>
              <input
                value={state.productName}
                onChange={(event) =>
                  updateField("productName", event.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Linked formulation (optional)
              </label>
              <select
                value={state.formulationId}
                onChange={(event) =>
                  updateField("formulationId", event.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {formulations.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Packaging
              </label>
              <select
                value={state.packagingType}
                onChange={(event) =>
                  updateField(
                    "packagingType",
                    event.target.value as WizardState["packagingType"],
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {PACKAGING_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Pack volume (L)
              </label>
              <input
                value={state.packVolumeL}
                onChange={(event) =>
                  updateField("packVolumeL", event.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                inputMode="decimal"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Planned shelf-life
              </label>
              <select
                value={state.plannedShelfLifeDays}
                onChange={(event) =>
                  updateField(
                    "plannedShelfLifeDays",
                    Number(
                      event.target.value,
                    ) as WizardState["plannedShelfLifeDays"],
                  )
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {PLANNED_SHELF_LIFE_OPTIONS.map((days) => (
                  <option key={days} value={days}>
                    {Math.round(days / 30)} months ({days} days)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Start date
              </label>
              <input
                type="date"
                value={state.startDate}
                onChange={(event) =>
                  updateField("startDate", event.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Carbonated product
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    checked={state.carbonated}
                    onChange={() => updateField("carbonated", true)}
                  />
                  Yes
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    checked={!state.carbonated}
                    onChange={() => updateField("carbonated", false)}
                  />
                  No
                </label>
                <input
                  value={state.co2AtFilling}
                  onChange={(event) =>
                    updateField("co2AtFilling", event.target.value)
                  }
                  disabled={!state.carbonated}
                  className="w-40 rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50"
                  placeholder="C0 g/L"
                  inputMode="decimal"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                End-of-life CO2 must be ≥90% of initial, and specific
                decarbonization time must be ≤300.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">
            2) Test design & conditions
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Conditions
              </p>
              {CONDITION_TYPES.map((condition) => (
                <label
                  key={condition}
                  className="flex items-start gap-2 rounded border border-gray-200 p-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={state.selectedConditions.includes(condition)}
                    onChange={() => toggleCondition(condition)}
                  />
                  <span>{condition.replaceAll("_", " ")}</span>
                </label>
              ))}
              <p className="text-xs text-gray-500">
                Select one or both test methods.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Planning options
              </p>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={state.includePetPackagingChangeCase}
                  onChange={(event) =>
                    updateField(
                      "includePetPackagingChangeCase",
                      event.target.checked,
                    )
                  }
                  disabled={state.packagingType !== "PET"}
                />
                PET packaging-change monthly checkpoints
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={state.reserveCoefficientEnabled}
                  onChange={(event) =>
                    updateField(
                      "reserveCoefficientEnabled",
                      event.target.checked,
                    )
                  }
                />
                Apply reserve coefficient 1.15
              </label>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Market requirements (optional)
                </label>
                <textarea
                  value={state.marketRequirements}
                  onChange={(event) =>
                    updateField("marketRequirements", event.target.value)
                  }
                  className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Use this to document migration/compliance market specifics"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
            Real-time typical: 20–25°C, RH ~60%, 200 lux (if needed), wavelength
            580–750 nm. Accelerated: 40–42°C.
          </div>

          <div className="mt-4 rounded-md border border-gray-200 p-3">
            <p className="text-sm font-semibold text-gray-900">
              Q10 calculator
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Q10 estimates reaction/shelf-life acceleration. Default 2.5,
              adjustable 2–3.
            </p>
            <div className="mt-2 grid gap-2 md:grid-cols-4">
              <input
                value={q10R1}
                onChange={(e) => setQ10R1(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="R1"
              />
              <input
                value={q10T1}
                onChange={(e) => setQ10T1(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="T1"
              />
              <input
                value={q10T2}
                onChange={(e) => setQ10T2(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="T2"
              />
              <input
                value={q10Value}
                onChange={(e) => setQ10Value(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Q10"
              />
            </div>
            <div className="mt-2 text-sm text-gray-700">
              {q10Result
                ? `R2 = ${q10Result.r2.toFixed(2)}; with reserve coefficient 1.15: ${q10Result.reserve.toFixed(2)}`
                : "Enter valid values to compute R2."}
            </div>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">
            3) Execution & sampling timeline
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Timeline is generated from planned shelf-life, packaging, and
            selected conditions.
          </p>
          <div className="mt-3 overflow-x-auto rounded border border-gray-200">
            <table className="w-full min-w-220 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <tr>
                  <th className="px-3 py-2">Condition</th>
                  <th className="px-3 py-2">Day offset</th>
                  <th className="px-3 py-2">Planned date</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Required liters</th>
                  <th className="px-3 py-2">Required packs</th>
                  <th className="px-3 py-2">Analyses</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((event, index) => (
                  <tr
                    key={`${event.conditionType}-${event.dayOffset}-${index}`}
                    className="border-t border-gray-100"
                  >
                    <td className="px-3 py-2">
                      {event.conditionType.replaceAll("_", " ")}
                    </td>
                    <td className="px-3 py-2">D+{event.dayOffset}</td>
                    <td className="px-3 py-2">
                      {addDays(
                        new Date(`${state.startDate}T00:00:00`),
                        event.dayOffset,
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">{event.type}</td>
                    <td className="px-3 py-2">
                      {event.requiredLiters.toFixed(1)} L
                    </td>
                    <td className="px-3 py-2">{event.requiredPacks}</td>
                    <td className="px-3 py-2">
                      {event.requiredAnalyses.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              Total events: <span className="font-semibold">{plan.length}</span>
            </div>
            <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              Total minimum sample requirement:{" "}
              <span className="font-semibold">
                {totals.liters.toFixed(1)} L / {totals.packs} packs
              </span>
            </div>
          </div>
          <div className="mt-3 rounded border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Materials for test production
            </p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <input
                value={state.materialsSupplier}
                onChange={(e) =>
                  updateField("materialsSupplier", e.target.value)
                }
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Supplier"
              />
              <input
                value={state.materialsTerms}
                onChange={(e) => updateField("materialsTerms", e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="Terms"
              />
            </div>
            <div className="mt-2 space-y-2">
              {state.materialItems.map((item, index) => (
                <div
                  key={`mat-${index}`}
                  className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]"
                >
                  <input
                    value={item.ingredientName}
                    onChange={(e) =>
                      updateMaterial(index, { ingredientName: e.target.value })
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    placeholder="Ingredient"
                  />
                  <input
                    value={item.quantity}
                    onChange={(e) =>
                      updateMaterial(index, { quantity: e.target.value })
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    placeholder="Qty"
                  />
                  <input
                    value={item.unit}
                    onChange={(e) =>
                      updateMaterial(index, { unit: e.target.value })
                    }
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    placeholder="Unit"
                  />
                  <button
                    type="button"
                    onClick={() => removeMaterialRow(index)}
                    className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addMaterialRow}
                className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700"
              >
                + Add material item
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">
            4) Results entry setup
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Each event in dashboard has tabs for Microbiology, Phys-chem, CO2,
            Organoleptic, Visual packaging, and Migration.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>
              Normative references are shown next to fields; out-of-spec values
              require deviation comment.
            </li>
            <li>
              Organoleptic requires at least 7 panelists and tracks
              deterioration vs baseline (max 20%).
            </li>
            <li>
              CO2 rules include specific decarbonization time ≤300 and
              end-of-life carbonation ≥90% of initial.
            </li>
            <li>
              Internal coating evaluation is included for aluminum and tetra
              packaging.
            </li>
          </ul>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold text-gray-900">
            5) Conclusions setup
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Responsible person
              </label>
              <input
                value={state.responsiblePerson}
                onChange={(event) =>
                  updateField("responsiblePerson", event.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Created by
              </label>
              <input
                value={state.createdBy}
                onChange={(event) =>
                  updateField("createdBy", event.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Planning notes
              </label>
              <textarea
                value={state.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Document assumptions, tolerances, and rationale"
              />
            </div>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          disabled={step === 1}
        >
          Previous
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setStep((current) => Math.min(STEPS.length, current + 1))
            }
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            disabled={step === STEPS.length}
          >
            Next
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {saving ? "Creating..." : "Create test"}
          </button>
        </div>
      </div>
    </main>
  );
}
