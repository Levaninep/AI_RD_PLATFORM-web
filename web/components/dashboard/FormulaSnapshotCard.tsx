"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  FlaskConical,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  applyBrixTemperatureCorrection,
  brixToDensityGPerML,
} from "@/lib/brix";

const STORAGE_KEY = "dashboard.formulaSnapshot.visibleParameters";

type FormulaParameterKey =
  | "targetBrix"
  | "correctedBrix"
  | "targetPH"
  | "density"
  | "co2GPerL"
  | "temperatureC"
  | "targetMassPerLiterG"
  | "waterGramsPerLiter"
  | "batchCost";

type FormulaIngredient = {
  id: string;
  dosageGrams: number;
  priceOverridePerKg: number | null;
  ingredient: {
    id: string;
    name: string;
    pricePerKgEur: number | null;
    pricePerKg: number | null;
  };
};

export type DashboardFormulaSnapshot = {
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
  totalGrams: number;
  totalCostUSD: number;
  costPerKgUSD: number;
  createdAt: string;
  updatedAt: string;
  ingredients: FormulaIngredient[];
};

type ParameterOption = {
  key: FormulaParameterKey;
  label: string;
};

const PARAMETER_OPTIONS: ParameterOption[] = [
  { key: "targetBrix", label: "Target Brix" },
  { key: "correctedBrix", label: "Corrected Brix" },
  { key: "targetPH", label: "pH" },
  { key: "density", label: "Density" },
  { key: "co2GPerL", label: "CO2" },
  { key: "temperatureC", label: "Temperature" },
  { key: "targetMassPerLiterG", label: "Mass / L" },
  { key: "waterGramsPerLiter", label: "Water / L" },
  { key: "batchCost", label: "Batch Cost" },
];

const DEFAULT_VISIBLE_PARAMETERS: FormulaParameterKey[] = [
  "targetBrix",
  "targetPH",
  "density",
  "co2GPerL",
];

function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function resolveCorrectedBrix(
  formulation: DashboardFormulaSnapshot,
): number | null {
  if (formulation.correctedBrix != null) {
    return formulation.correctedBrix;
  }

  if (formulation.desiredBrix == null) {
    return formulation.targetBrix;
  }

  const temperatureC = formulation.temperatureC ?? 20;
  return applyBrixTemperatureCorrection(formulation.desiredBrix, temperatureC);
}

function resolveDensity(formulation: DashboardFormulaSnapshot): number | null {
  if (formulation.densityGPerML != null) {
    return formulation.densityGPerML;
  }

  const correctedBrix = resolveCorrectedBrix(formulation);
  return correctedBrix == null ? null : brixToDensityGPerML(correctedBrix);
}

function getParameterValue(
  formulation: DashboardFormulaSnapshot,
  key: FormulaParameterKey,
): string | null {
  switch (key) {
    case "targetBrix":
      return formulation.targetBrix == null
        ? null
        : `${formatNumber(formulation.targetBrix, 1)} Bx`;
    case "correctedBrix": {
      const correctedBrix = resolveCorrectedBrix(formulation);
      return correctedBrix == null
        ? null
        : `${formatNumber(correctedBrix, 1)} Bx`;
    }
    case "targetPH":
      return formulation.targetPH == null
        ? null
        : formatNumber(formulation.targetPH, 2);
    case "density": {
      const density = resolveDensity(formulation);
      return density == null ? null : `${formatNumber(density, 3)} g/ml`;
    }
    case "co2GPerL":
      return formulation.co2GPerL == null
        ? null
        : `${formatNumber(formulation.co2GPerL, 2)} g/L`;
    case "temperatureC":
      return formulation.temperatureC == null
        ? null
        : `${formatNumber(formulation.temperatureC, 1)} C`;
    case "targetMassPerLiterG":
      return formulation.targetMassPerLiterG == null
        ? null
        : `${formatNumber(formulation.targetMassPerLiterG, 0)} g/L`;
    case "waterGramsPerLiter":
      return formulation.waterGramsPerLiter == null
        ? null
        : `${formatNumber(formulation.waterGramsPerLiter, 0)} g/L`;
    case "batchCost":
      return formulation.totalCostUSD > 0
        ? `$${formatNumber(formulation.totalCostUSD, 2)}`
        : null;
    default:
      return null;
  }
}

function getHeadlineMetric(formulation: DashboardFormulaSnapshot | null): {
  label: string;
  value: string;
} | null {
  if (!formulation) {
    return null;
  }

  const correctedBrix = resolveCorrectedBrix(formulation);
  if (correctedBrix != null) {
    return {
      label:
        formulation.correctedBrix != null ? "Corrected Brix" : "Target Brix",
      value: `${formatNumber(correctedBrix, 1)} Bx`,
    };
  }

  if (formulation.targetPH != null) {
    return {
      label: "pH",
      value: formatNumber(formulation.targetPH, 2),
    };
  }

  if (formulation.co2GPerL != null) {
    return {
      label: "CO2",
      value: `${formatNumber(formulation.co2GPerL, 2)} g/L`,
    };
  }

  return null;
}

function formatUpdatedAt(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function FormulaSnapshotCard({
  formulation,
  formulations = [],
  selectedFormulationId,
  onFormulationChange,
}: {
  formulation: DashboardFormulaSnapshot | null;
  formulations?: DashboardFormulaSnapshot[];
  selectedFormulationId?: string | null;
  onFormulationChange?: (formulationId: string) => void;
}) {
  const [visibleParameters, setVisibleParameters] = useState<
    FormulaParameterKey[]
  >(DEFAULT_VISIBLE_PARAMETERS);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        return;
      }

      const nextVisible = parsed.filter((value): value is FormulaParameterKey =>
        PARAMETER_OPTIONS.some((option) => option.key === value),
      );

      if (nextVisible.length > 0) {
        setVisibleParameters(nextVisible);
      }
    } catch {
      // Ignore invalid local preferences and fall back to defaults.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(visibleParameters),
      );
    } catch {
      // Ignore storage failures.
    }
  }, [visibleParameters]);

  const ingredientBreakdown = useMemo(() => {
    if (!formulation || formulation.ingredients.length === 0) {
      return [];
    }

    const safeTotalGrams =
      formulation.totalGrams > 0
        ? formulation.totalGrams
        : formulation.ingredients.reduce(
            (sum, ingredient) => sum + ingredient.dosageGrams,
            0,
          );

    return [...formulation.ingredients]
      .sort((left, right) => right.dosageGrams - left.dosageGrams)
      .slice(0, 4)
      .map((ingredient) => ({
        ...ingredient,
        percentage:
          safeTotalGrams > 0
            ? Number(
                ((ingredient.dosageGrams / safeTotalGrams) * 100).toFixed(1),
              )
            : 0,
      }));
  }, [formulation]);

  const availableParameters = useMemo(() => {
    if (!formulation) {
      return [] as ParameterOption[];
    }

    return PARAMETER_OPTIONS.filter(
      (option) => getParameterValue(formulation, option.key) !== null,
    );
  }, [formulation]);

  const headlineMetric = useMemo(
    () => getHeadlineMetric(formulation),
    [formulation],
  );

  const selectedParameters = useMemo(() => {
    if (!formulation) {
      return [] as Array<{
        key: FormulaParameterKey;
        label: string;
        value: string;
      }>;
    }

    const nextKeys = visibleParameters.filter((key) =>
      availableParameters.some((option) => option.key === key),
    );
    const fallbackKeys = availableParameters
      .map((option) => option.key)
      .slice(0, 4);
    const keysToRender = nextKeys.length > 0 ? nextKeys : fallbackKeys;
    const headlineParameterKey =
      headlineMetric?.label === "pH"
        ? "targetPH"
        : headlineMetric?.label?.includes("Brix")
          ? headlineMetric.label === "Corrected Brix"
            ? "correctedBrix"
            : "targetBrix"
          : headlineMetric?.label === "CO2"
            ? "co2GPerL"
            : null;

    return keysToRender
      .filter((key) => key !== headlineParameterKey)
      .map((key) => {
        const option = PARAMETER_OPTIONS.find((item) => item.key === key);
        const value = getParameterValue(formulation, key);
        if (!option || value === null) {
          return null;
        }

        return {
          key,
          label: option.label,
          value,
        };
      })
      .filter(
        (
          item,
        ): item is { key: FormulaParameterKey; label: string; value: string } =>
          item !== null,
      );
  }, [availableParameters, formulation, headlineMetric, visibleParameters]);

  function handleCheckedChange(key: FormulaParameterKey, checked: boolean) {
    setVisibleParameters((current) => {
      if (checked) {
        return current.includes(key) ? current : [...current, key];
      }

      if (current.length <= 1) {
        return current;
      }

      return current.filter((item) => item !== key);
    });
  }

  return (
    <article className="dashboard-card p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Formula snapshot
          </p>
          <h3 className="mt-1 text-3xl font-semibold tracking-tight text-slate-800">
            {formulation?.name ?? "No saved formulas yet"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {formulation
              ? `${formulation.category} · updated ${formatUpdatedAt(formulation.updatedAt)}`
              : "Save a formulation to keep real technical parameters visible here."}
          </p>
        </div>

        {formulation ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-slate-200 bg-slate-50 text-slate-700"
              >
                <SlidersHorizontal className="size-3.5" />
                Choose parameters
                <ChevronDown className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Visible parameters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableParameters.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.key}
                  checked={visibleParameters.includes(option.key)}
                  onCheckedChange={(checked) =>
                    handleCheckedChange(option.key, Boolean(checked))
                  }
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-2.5">
          {ingredientBreakdown.length > 0 ? (
            ingredientBreakdown.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5"
              >
                <div className="mb-1.5 flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>{item.ingredient.name}</span>
                  <span>{formatNumber(item.percentage, 1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-200">
                  <div
                    className="h-1.5 rounded-full bg-blue-500"
                    style={{
                      width: `${Math.max(4, Math.min(item.percentage, 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Ingredient ratios will appear here after you save a formulation.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Technical Parameters
          </p>

          {formulation && headlineMetric ? (
            <>
              <p className="mt-3 text-xs font-medium uppercase tracking-widest text-slate-500">
                {headlineMetric.label}
              </p>
              <p className="mt-1 text-4xl font-semibold leading-none text-slate-900">
                {headlineMetric.value}
              </p>
            </>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
              No saved formulation parameters available yet.
            </div>
          )}

          {selectedParameters.length > 0 ? (
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {selectedParameters.map((item) => (
                <p
                  key={item.key}
                  className="flex items-center justify-between gap-4"
                >
                  <span>{item.label}</span>
                  <span className="text-right font-semibold text-slate-800">
                    {item.value}
                  </span>
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Link
          href="/formulations"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Open formulations
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="justify-between rounded-lg border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              Saved formulas
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Select formula</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {formulations.length ? (
              formulations.map((item) => {
                const isActive =
                  item.id ===
                  (selectedFormulationId ?? formulation?.id ?? null);

                return (
                  <DropdownMenuItem
                    key={item.id}
                    onSelect={() => onFormulationChange?.(item.id)}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate">{item.name}</span>
                    {isActive ? (
                      <Check className="size-4 text-blue-600" />
                    ) : null}
                  </DropdownMenuItem>
                );
              })
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/saved-formulas">Saved formulas</Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Link
          href="/shelf-life"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
        >
          Simulate shelf-life
        </Link>
      </div>

      {formulation ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <FlaskConical className="size-3.5 text-slate-500" />
          <span>{formulation.ingredients.length} ingredients</span>
          <span className="text-slate-300">|</span>
          <span>{formatNumber(formulation.totalGrams, 0)} g total mass</span>
          {formulation.totalCostUSD > 0 ? (
            <>
              <span className="text-slate-300">|</span>
              <span>
                ${formatNumber(formulation.totalCostUSD, 2)} batch cost
              </span>
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
