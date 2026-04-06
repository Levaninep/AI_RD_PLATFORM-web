"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calculator,
  DollarSign,
  TrendingUp,
  Weight,
  Package,
  FlaskConical,
  ChevronDown,
  Layers,
} from "lucide-react";

type CogsItem = {
  ingredientName: string;
  dosageGrams: number;
  scaledDosageGrams: number;
  pricePerKg: number;
  costContributionUSD: number;
  costContributionPerLiterUSD: number;
};

type CogsResult = {
  id: string;
  name: string;
  category: string;
  totalGrams: number;
  waterGrams: number;
  totalCostUSD: number;
  costPerKgUSD: number;
  costPerLiterUSD: number;
  costFor1LiterUSD: number;
  scaleTo1Liter: number;
  items: CogsItem[];
};

type ApiErrorResponse = {
  error?: {
    message?: string;
  };
};

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

function formatMoney(value: number): string {
  return value.toFixed(4);
}

function CogsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formulationIdFromQuery = searchParams.get("formulationId") ?? "";

  const [allRows, setAllRows] = useState<CogsResult[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedRow, setSelectedRow] = useState<CogsResult | null>(null);
  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoadingAll(true);
    setError(null);

    try {
      const response = await fetch("/api/cogs", { cache: "no-store" });
      const data = await readJsonSafe<CogsResult[] | ApiErrorResponse>(
        response,
      );

      if (!response.ok) {
        throw new Error(
          (data as ApiErrorResponse | null)?.error?.message ||
            `Failed to load COGS list (HTTP ${response.status}).`,
        );
      }

      setAllRows((data as CogsResult[]) ?? []);
    } catch (fetchError: unknown) {
      setError(getErrorMessage(fetchError));
    } finally {
      setLoadingAll(false);
    }
  }, []);

  const loadById = useCallback(async (id: string) => {
    if (!id) {
      setSelectedRow(null);
      return;
    }

    setLoadingSelected(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/cogs?formulationId=${encodeURIComponent(id)}`,
        {
          cache: "no-store",
        },
      );
      const data = await readJsonSafe<CogsResult | ApiErrorResponse>(response);

      if (!response.ok) {
        throw new Error(
          (data as ApiErrorResponse | null)?.error?.message ||
            `Failed to load formulation COGS (HTTP ${response.status}).`,
        );
      }

      setSelectedRow((data as CogsResult) ?? null);
    } catch (fetchError: unknown) {
      setSelectedRow(null);
      setError(getErrorMessage(fetchError));
    } finally {
      setLoadingSelected(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!formulationIdFromQuery) {
      setSelectedId("");
      setSelectedRow(null);
      return;
    }

    setSelectedId(formulationIdFromQuery);
    void loadById(formulationIdFromQuery);
  }, [formulationIdFromQuery, loadById]);

  const selectedName = useMemo(() => {
    const match = allRows.find((item) => item.id === selectedId);
    return match ? `${match.name} (${match.category})` : "";
  }, [allRows, selectedId]);

  function handleSelectChange(nextId: string) {
    setSelectedId(nextId);

    if (!nextId) {
      router.push("/cogs");
      setSelectedRow(null);
      return;
    }

    router.push(`/cogs?formulationId=${encodeURIComponent(nextId)}`);
    void loadById(nextId);
  }

  const topCostDriver = useMemo(() => {
    if (!selectedRow || selectedRow.items.length === 0) return null;
    return [...selectedRow.items].sort(
      (a, b) => b.costContributionUSD - a.costContributionUSD,
    )[0];
  }, [selectedRow]);

  const topCostShare = useMemo(() => {
    if (!topCostDriver || !selectedRow) return 0;
    if (selectedRow.totalCostUSD === 0) return 0;
    return (topCostDriver.costContributionUSD / selectedRow.totalCostUSD) * 100;
  }, [topCostDriver, selectedRow]);

  return (
    <main className="relative py-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-[#3B5BFF]/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#3B5BFF]/10 blur-3xl" />
      </div>

      {/* Hero header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, #3B5BFF 0%, #2F54EB 100%)",
                boxShadow: "0 8px 20px rgba(59, 91, 255, 0.25)",
              }}
            >
              <Calculator className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-[#3B5BFF]/10 px-3 py-0.5 text-xs font-semibold tracking-wide text-[#3B5BFF] uppercase">
              Cost Engine
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            COGS Calculator
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            Real-time cost-of-goods analysis across your formulations.
            Density&nbsp;=&nbsp;1.0&nbsp;kg/L (MVP).
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/formulations")}
          className="group flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-[#3B5BFF]/30 hover:text-[#3B5BFF] hover:shadow-md"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Formulations
        </button>
      </div>

      {/* Main workspace card */}
      <div className="cogs-workspace-card">
        {/* Selector bar */}
        <div className="cogs-selector-bar">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-[#3B5BFF]" />
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Select Formulation
            </span>
          </div>
          <div className="relative min-w-64">
            <select
              value={selectedId}
              onChange={(event) => handleSelectChange(event.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-gray-800 shadow-sm transition focus:border-[#3B5BFF] focus:ring-2 focus:ring-[#3B5BFF]/10 focus:outline-none"
              disabled={loadingAll}
            >
              <option value="">All formulations</option>
              {allRows.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name} ({row.category})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Error state */}
        {error ? (
          <div className="mx-6 mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {/* All-formulations list view */}
        {!selectedId ? (
          <div className="p-6 pt-0">
            {loadingAll ? (
              <div className="cogs-loading-state">
                <div className="cogs-loading-spinner" />
                <p className="text-sm font-medium text-gray-500">
                  Calculating costs across all formulations...
                </p>
              </div>
            ) : allRows.length === 0 ? (
              <div className="cogs-empty-state">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#3B5BFF]/10">
                  <Layers className="h-8 w-8 text-[#3B5BFF]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  No Formulations Yet
                </h3>
                <p className="max-w-sm text-sm text-gray-500">
                  Create a formulation with ingredients to see your cost
                  breakdown here.
                </p>
                <button
                  type="button"
                  onClick={() => router.push("/formulations")}
                  className="dashboard-cta-button mt-2 px-6 py-2.5 text-sm"
                >
                  Create Formulation
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">
                    {allRows.length} Formulation{allRows.length !== 1 && "s"}
                  </h2>
                  <span className="text-xs text-gray-400">
                    Click to analyze
                  </span>
                </div>
                {allRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => handleSelectChange(row.id)}
                    className="cogs-formulation-row"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#3B5BFF]/8 text-[#3B5BFF]">
                        <FlaskConical className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">
                          {row.name}
                        </p>
                        <p className="text-xs text-gray-400">{row.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#3B5BFF]">
                          ${formatMoney(row.costPerLiterUSD)}
                        </p>
                        <p className="text-xs text-gray-400">per liter</p>
                      </div>
                      <ChevronDown className="h-4 w-4 -rotate-90 text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Selected formulation detail view */
          <div className="p-6 pt-0">
            {loadingSelected ? (
              <div className="cogs-loading-state">
                <div className="cogs-loading-spinner" />
                <p className="text-sm font-medium text-gray-500">
                  Analyzing {selectedName || "formulation"} costs...
                </p>
              </div>
            ) : !selectedRow ? (
              <div className="cogs-empty-state">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-amber-100 to-orange-100">
                  <Package className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  COGS Data Not Found
                </h3>
                <p className="max-w-sm text-sm text-gray-500">
                  This formulation may not have ingredients or pricing data
                  configured.
                </p>
              </div>
            ) : (
              <>
                {/* Formulation name */}
                <div className="mb-5 flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    {selectedName || "Selected Formulation"}
                  </h2>
                  <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    Analyzed
                  </span>
                </div>

                {/* KPI cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <article className="cogs-kpi-card">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#3B5BFF]/10 text-[#3B5BFF]">
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                        Cost / Liter
                      </p>
                    </div>
                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                      ${formatMoney(selectedRow.costPerLiterUSD)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">USD / L</p>
                  </article>

                  <article className="cogs-kpi-card">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                        Cost / Kg
                      </p>
                    </div>
                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                      ${formatMoney(selectedRow.costPerKgUSD)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">USD / kg</p>
                  </article>

                  <article className="cogs-kpi-card">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                        <Weight className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                        Recipe Weight
                      </p>
                    </div>
                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                      {selectedRow.totalGrams.toFixed(1)}
                      <span className="ml-1 text-base font-medium text-gray-400">
                        g
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      total in recipe
                    </p>
                  </article>

                  <article className="cogs-kpi-card">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                        <Package className="h-4 w-4" />
                      </div>
                      <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                        Batch Cost
                      </p>
                    </div>
                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                      ${formatMoney(selectedRow.totalCostUSD)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      current batch total
                    </p>
                  </article>
                </div>

                {/* Top cost driver callout */}
                {topCostDriver && (
                  <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#3B5BFF]/15 bg-[#3B5BFF]/5 px-5 py-3">
                    <TrendingUp className="h-5 w-5 text-[#3B5BFF]" />
                    <div>
                      <p className="text-xs font-semibold text-[#3B5BFF] uppercase">
                        Top Cost Driver
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">
                          {topCostDriver.ingredientName}
                        </span>{" "}
                        &mdash; $
                        {formatMoney(topCostDriver.costContributionUSD)}(
                        {topCostShare.toFixed(1)}% of total)
                      </p>
                    </div>
                  </div>
                )}

                {/* Ingredient cost table */}
                <div className="cogs-table-wrapper">
                  <table className="w-full min-w-180 text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          Ingredient
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          Dosage (g)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          Price/kg
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedRow.items.map((item) => (
                        <tr
                          key={item.ingredientName}
                          className="transition-colors hover:bg-[#3B5BFF]/5"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {item.ingredientName}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-600">
                            {item.dosageGrams.toFixed(4)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-600">
                            ${formatMoney(item.pricePerKg)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-blue-700">
                            ${formatMoney(item.costContributionUSD)}
                          </td>
                        </tr>
                      ))}
                      {selectedRow.waterGrams > 0 && (
                        <tr className="transition-colors hover:bg-[#3B5BFF]/5 bg-blue-50/40">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            Water
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-600">
                            {selectedRow.waterGrams.toFixed(4)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-400">
                            —
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-gray-400">
                            —
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-gray-200">
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-gray-700">
                          {selectedRow.totalGrams.toFixed(4)}
                        </td>
                        <td />
                        <td className="px-4 py-3 text-right font-mono font-bold text-blue-800">
                          ${formatMoney(selectedRow.totalCostUSD)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function CogsPage() {
  return (
    <Suspense
      fallback={
        <main className="relative py-8">
          <div className="mb-8">
            <div className="mb-2 h-10 w-32 animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-8 w-64 animate-pulse rounded-xl bg-gray-200" />
            <div className="mt-2 h-4 w-80 animate-pulse rounded-lg bg-gray-100" />
          </div>
          <div className="cogs-workspace-card">
            <div className="p-6">
              <div className="cogs-loading-state">
                <div className="cogs-loading-spinner" />
                <p className="text-sm font-medium text-gray-500">
                  Initializing COGS Calculator...
                </p>
              </div>
            </div>
          </div>
        </main>
      }
    >
      <CogsPageContent />
    </Suspense>
  );
}
