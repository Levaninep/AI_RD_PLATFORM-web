"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { ApiErrorResponse, Formulation } from "@/lib/types";

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
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

export default function SavedFormulasPage() {
  const [items, setItems] = useState<Formulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSavedFormulas = useCallback(async () => {
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
            `Failed to load saved formulas (HTTP ${response.status}).`,
        );
      }

      setItems((data as Formulation[]) ?? []);
    } catch (fetchError: unknown) {
      setError(getErrorMessage(fetchError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSavedFormulas();
  }, [loadSavedFormulas]);

  return (
    <main className="py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Saved formulas
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            View saved formulations separately from the formulation builder.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadSavedFormulas();
          }}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          Loading saved formulas...
        </div>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
          No saved formulas yet.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((formulation) => (
            <article
              key={formulation.id}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {formulation.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {formulation.category}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Target Brix: {formulation.targetBrix ?? "—"} • Target pH:{" "}
                    {formulation.targetPH ?? "—"}
                  </p>
                </div>

                <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                  Total cost: {formatMoney(formulation.totalCostUSD)} • Cost/kg:{" "}
                  {formatMoney(formulation.costPerKgUSD)}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  href={`/cogs?formulationId=${formulation.id}`}
                  className="rounded-md border border-blue-200 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-50"
                >
                  Open in Calculator
                </Link>
                <Link
                  href="/formulations"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Open Formulations
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
