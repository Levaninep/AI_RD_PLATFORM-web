"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  return (
    <main className="py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">COGS</h1>
          <p className="mt-1 text-sm text-gray-600">
            MVP assumes density = 1.0 kg/L. Add density later for higher
            accuracy.
          </p>
        </div>

        <div className="flex min-w-70 flex-col gap-2">
          <button
            type="button"
            onClick={() => router.push("/formulations")}
            className="self-end rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Formulations
          </button>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500">
              Formulation
            </label>
            <select
              value={selectedId}
              onChange={(event) => handleSelectChange(event.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              disabled={loadingAll}
            >
              <option value="">All formulations</option>
              {allRows.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name} ({row.category})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!selectedId ? (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">
            Formulations
          </h2>

          {loadingAll ? (
            <div className="mt-3 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
              Loading COGS data...
            </div>
          ) : allRows.length === 0 ? (
            <div className="mt-3 rounded-md border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
              No formulations available.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {allRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => handleSelectChange(row.id)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {row.name}
                      </p>
                      <p className="text-xs text-gray-500">{row.category}</p>
                    </div>
                    <div className="text-sm font-semibold text-blue-700">
                      ${formatMoney(row.costPerLiterUSD)} / L
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mt-6">
          <h2 className="text-base font-semibold text-gray-900">
            {selectedName || "Selected formulation"}
          </h2>

          {loadingSelected ? (
            <div className="mt-3 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
              Loading selected formulation COGS...
            </div>
          ) : !selectedRow ? (
            <div className="mt-3 rounded-md border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
              Formulation COGS not found.
            </div>
          ) : (
            <>
              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Cost per Liter
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    ${formatMoney(selectedRow.costPerLiterUSD)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">USD / L</p>
                </article>

                <article className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Cost per Kg
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    ${formatMoney(selectedRow.costPerKgUSD)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">USD / kg</p>
                </article>

                <article className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Total grams
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {selectedRow.totalGrams.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">g in recipe</p>
                </article>

                <article className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Batch total cost
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    ${formatMoney(selectedRow.totalCostUSD)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    USD current batch
                  </p>
                </article>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Scale to 1L factor: {selectedRow.scaleTo1Liter.toFixed(6)}
              </p>

              <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                <table className="w-full min-w-190 text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">Ingredient</th>
                      <th className="px-3 py-2 font-medium">Dosage (g)</th>
                      <th className="px-3 py-2 font-medium">
                        Dosage for 1L (g)
                      </th>
                      <th className="px-3 py-2 font-medium">Price/kg (USD)</th>
                      <th className="px-3 py-2 font-medium">
                        Cost contribution per 1L (USD)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRow.items.map((item) => (
                      <tr
                        key={item.ingredientName}
                        className="border-t border-gray-100 text-gray-700"
                      >
                        <td className="px-3 py-2 text-gray-900">
                          {item.ingredientName}
                        </td>
                        <td className="px-3 py-2">
                          {item.dosageGrams.toFixed(4)}
                        </td>
                        <td className="px-3 py-2">
                          {item.scaledDosageGrams.toFixed(4)}
                        </td>
                        <td className="px-3 py-2">
                          {formatMoney(item.pricePerKg)}
                        </td>
                        <td className="px-3 py-2">
                          {formatMoney(item.costContributionPerLiterUSD)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}

export default function CogsPage() {
  return (
    <Suspense
      fallback={
        <main className="py-6">
          <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
            Loading COGS...
          </div>
        </main>
      }
    >
      <CogsPageContent />
    </Suspense>
  );
}
