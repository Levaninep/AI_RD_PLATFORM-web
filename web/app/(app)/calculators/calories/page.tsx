"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Flame,
  RefreshCcw,
  Zap,
  Wheat,
  CandyCane,
  FlaskConical,
  ChevronDown,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FormulationOption = {
  id: string;
  name: string;
};

type NutritionValues = {
  energyKcal: number;
  energyKj: number;
  fat: number;
  saturates: number;
  carbohydrates: number;
  sugars: number;
  protein: number;
  salt: number;
};

type CaloriesResponse = {
  formulationId: string;
  formulationName: string;
  batchMassGrams: number;
  batchVolumeMl: number;
  totalsPerBatch: NutritionValues;
  per100ml: NutritionValues;
  ingredientsBreakdown: Array<{
    ingredientId: string;
    ingredientName: string;
    dosageGrams: number;
    contributionPer100ml: NutritionValues;
  }>;
  warnings: string[];
};

type ApiErrorResponse = {
  error?: { message?: string };
};

function isSuppressibleWarning(message: string): boolean {
  const normalized = message.trim().toLowerCase();

  if (normalized.startsWith("batch density is missing.")) {
    return true;
  }

  if (
    normalized.startsWith("estimated nutrition for") &&
    (normalized.includes("from concentrate brix") ||
      normalized.includes("from sweetener profile") ||
      normalized.includes("from puree profile"))
  ) {
    return true;
  }

  return false;
}

function fmt(value: number, digits = 2): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "0.00";
}

export default function CaloriesCalculatorPage() {
  const router = useRouter();
  const [options, setOptions] = useState<FormulationOption[]>([]);
  const [formulaId, setFormulaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CaloriesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadFormulas() {
      try {
        const response = await fetch("/api/formulations", {
          cache: "no-store",
        });
        const body = (await response.json().catch(() => null)) as
          | Array<{ id?: string; name?: string }>
          | { error?: { message?: string } }
          | null;

        if (!response.ok || !Array.isArray(body)) {
          if (!active) return;
          setError(
            (body as { error?: { message?: string } } | null)?.error?.message ??
              "Unable to load formulations.",
          );
          return;
        }

        const next = body
          .filter((item) => item.id && item.name)
          .map((item) => ({ id: String(item.id), name: String(item.name) }));

        if (!active) return;
        setOptions(next);
        if (next.length > 0) {
          setFormulaId((prev) => prev || next[0].id);
        }
      } catch {
        if (!active) return;
        setError("Unable to load formulations.");
      }
    }

    void loadFormulas();

    return () => {
      active = false;
    };
  }, []);

  async function runCalculation() {
    if (!formulaId) {
      setError("Select a formulation first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/calories?formulaId=${encodeURIComponent(formulaId)}`,
        {
          cache: "no-store",
        },
      );
      const body = (await response.json().catch(() => null)) as
        | CaloriesResponse
        | { error?: { message?: string } }
        | null;

      if (
        !response.ok ||
        !body ||
        "error" in body ||
        !("formulationId" in body)
      ) {
        setData(null);
        setError(
          body && "error" in body
            ? (body.error?.message ?? "Calculation failed.")
            : "Calculation failed.",
        );
        return;
      }

      setData(body as CaloriesResponse);
    } catch {
      setData(null);
      setError("Calculation failed.");
    } finally {
      setLoading(false);
    }
  }

  const visibleWarnings = useMemo(
    () =>
      (data?.warnings ?? []).filter(
        (warning) => !isSuppressibleWarning(warning),
      ),
    [data],
  );

  return (
    <main className="relative py-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      {/* Hero header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25">
              <Flame className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-orange-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-orange-700 uppercase">
              Nutrition
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Calories Calculator
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            Estimated nutrition per 100 ml for any saved formulation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/saved-formulas")}
          className="group flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-orange-300 hover:text-orange-700 hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Formulas
        </button>
      </div>

      {/* Main workspace card */}
      <div className="cogs-workspace-card">
        {/* Selector bar */}
        <div className="cogs-selector-bar">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-orange-600" />
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Select Formula
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative min-w-64">
              <select
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-800 shadow-sm transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none"
                value={formulaId}
                onChange={(event) => setFormulaId(event.target.value)}
              >
                {options.length === 0 ? (
                  <option value="">No formulations</option>
                ) : null}
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <Button
              onClick={() => void runCalculation()}
              disabled={loading || !formulaId}
              className="rounded-xl bg-linear-to-br from-orange-500 to-amber-600 px-5 text-white shadow-sm hover:shadow-md"
            >
              {loading ? "Calculating..." : "Calculate"}
            </Button>
            <Button
              variant="outline"
              onClick={() => void runCalculation()}
              disabled={loading || !formulaId}
              className="rounded-xl"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Recalc
            </Button>
          </div>
        </div>

        {/* Error state */}
        {error ? (
          <div className="mx-6 mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="p-6 pt-0">
          {/* Empty / initial state */}
          {!data && !loading ? (
            <div className="cogs-empty-state">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-orange-100 to-amber-100">
                <Layers className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                Ready to Analyze
              </h3>
              <p className="max-w-sm text-sm text-gray-500">
                Select a formula and click Calculate to see nutrition cards and
                breakdown tables.
              </p>
            </div>
          ) : null}

          {loading ? (
            <div className="cogs-loading-state">
              <div className="cogs-loading-spinner" />
              <p className="text-sm font-medium text-gray-500">
                Computing nutrition values...
              </p>
            </div>
          ) : null}

          {data ? (
            <>
              {/* KPI cards */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article className="cogs-kpi-card">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                      <Zap className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                      Energy
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                    {fmt(data.per100ml.energyKcal, 1)}
                    <span className="ml-1 text-base font-medium text-gray-400">
                      kcal
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-400">per 100 ml</p>
                </article>

                <article className="cogs-kpi-card">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                      <Wheat className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                      Carbohydrates
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                    {fmt(data.per100ml.carbohydrates, 1)}
                    <span className="ml-1 text-base font-medium text-gray-400">
                      g
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-400">per 100 ml</p>
                </article>

                <article className="cogs-kpi-card">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                      <CandyCane className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                      Sugars
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                    {fmt(data.per100ml.sugars, 1)}
                    <span className="ml-1 text-base font-medium text-gray-400">
                      g
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-400">per 100 ml</p>
                </article>

                <article className="cogs-kpi-card">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                      <FlaskConical className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                      Salt
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                    {fmt(data.per100ml.salt, 2)}
                    <span className="ml-1 text-base font-medium text-gray-400">
                      g
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-gray-400">per 100 ml</p>
                </article>
              </div>

              {/* Warnings */}
              {visibleWarnings.length > 0 ? (
                <div className="mb-5 space-y-2">
                  {visibleWarnings.map((warning) => (
                    <div
                      key={warning}
                      className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <p className="text-sm text-amber-800">{warning}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Nutrition per 100 ml table */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Nutrition per 100 ml
                </h3>
                <div className="cogs-table-wrapper">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100">
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          Nutrient
                        </TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          Value
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                      <TableRow className="transition-colors hover:bg-orange-50/40">
                        <TableCell className="px-4 py-3 font-medium text-gray-900">
                          Energy
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-gray-600">
                          {fmt(data.per100ml.energyKcal, 1)} kcal /{" "}
                          {fmt(data.per100ml.energyKj, 0)} kJ
                        </TableCell>
                      </TableRow>
                      <TableRow className="transition-colors hover:bg-orange-50/40">
                        <TableCell className="px-4 py-3 font-medium text-gray-900">
                          Fat
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-gray-600">
                          {fmt(data.per100ml.fat, 2)} g
                        </TableCell>
                      </TableRow>
                      <TableRow className="transition-colors hover:bg-orange-50/40">
                        <TableCell className="px-4 py-3 pl-8 text-gray-600">
                          of which saturates
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-gray-600">
                          {fmt(data.per100ml.saturates, 2)} g
                        </TableCell>
                      </TableRow>
                      <TableRow className="transition-colors hover:bg-orange-50/40">
                        <TableCell className="px-4 py-3 font-medium text-gray-900">
                          Carbohydrates
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-gray-600">
                          {fmt(data.per100ml.carbohydrates, 2)} g
                        </TableCell>
                      </TableRow>
                      <TableRow className="transition-colors hover:bg-orange-50/40">
                        <TableCell className="px-4 py-3 pl-8 text-gray-600">
                          of which sugars
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-gray-600">
                          {fmt(data.per100ml.sugars, 2)} g
                        </TableCell>
                      </TableRow>
                      <TableRow className="transition-colors hover:bg-orange-50/40">
                        <TableCell className="px-4 py-3 font-medium text-gray-900">
                          Protein
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-gray-600">
                          {fmt(data.per100ml.protein, 2)} g
                        </TableCell>
                      </TableRow>
                      <TableRow className="transition-colors hover:bg-orange-50/40">
                        <TableCell className="px-4 py-3 font-medium text-gray-900">
                          Salt
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-mono text-gray-600">
                          {fmt(data.per100ml.salt, 2)} g
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Ingredient contribution table */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Ingredient Contribution (per 100 ml)
                </h3>
                <div className="cogs-table-wrapper">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100">
                        <TableHead className="px-4 py-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          Ingredient
                        </TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          Dosage (g)
                        </TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          kcal
                        </TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          Carbs (g)
                        </TableHead>
                        <TableHead className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          Sugars (g)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-50">
                      {data.ingredientsBreakdown.map((row) => (
                        <TableRow
                          key={row.ingredientId}
                          className="transition-colors hover:bg-orange-50/40"
                        >
                          <TableCell className="px-4 py-3 font-medium text-gray-900">
                            {row.ingredientName}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right font-mono text-gray-600">
                            {fmt(row.dosageGrams, 2)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right font-mono text-gray-600">
                            {fmt(row.contributionPer100ml.energyKcal, 2)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right font-mono text-gray-600">
                            {fmt(row.contributionPer100ml.carbohydrates, 2)}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right font-mono font-semibold text-orange-700">
                            {fmt(row.contributionPer100ml.sugars, 2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
