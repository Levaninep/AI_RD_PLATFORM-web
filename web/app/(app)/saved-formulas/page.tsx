"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  ArrowLeft,
  FlaskConical,
  RefreshCcw,
  ChevronRight,
  DollarSign,
  Layers,
} from "lucide-react";
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
  const router = useRouter();
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
    <main className="relative py-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-indigo-200/20 blur-3xl" />
      </div>

      {/* Hero header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-500/25">
              <Bookmark className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-violet-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-violet-700 uppercase">
              Library
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Saved Formulations
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            View saved formulations separately from the formulation builder.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/formulations")}
            className="group flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-violet-300 hover:text-violet-700 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Builder
          </button>
          <button
            type="button"
            onClick={() => void loadSavedFormulas()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-violet-300 hover:text-violet-700 hover:shadow-md"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Main workspace card */}
      <div className="cogs-workspace-card">
        <div className="cogs-selector-bar">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-violet-600" />
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              {loading
                ? "Loading..."
                : `${items.length} Formulation${items.length !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* Error state */}
        {error ? (
          <div className="mx-6 mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="p-6 pt-0">
          {loading ? (
            <div className="cogs-loading-state">
              <div className="cogs-loading-spinner" />
              <p className="text-sm font-medium text-gray-500">
                Loading saved formulations...
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="cogs-empty-state">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-violet-100 to-purple-100">
                <Layers className="h-8 w-8 text-violet-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                No Saved Formulas Yet
              </h3>
              <p className="max-w-sm text-sm text-gray-500">
                Create and save a formulation in the builder to see it here.
              </p>
              <button
                type="button"
                onClick={() => router.push("/formulations")}
                className="dashboard-cta-button mt-2 px-6 py-2.5 text-sm"
              >
                Open Builder
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((formulation) => (
                <article
                  key={formulation.id}
                  className="cogs-formulation-row flex-col items-stretch gap-3 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-50 to-purple-50 text-violet-600">
                      <FlaskConical className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900">
                        {formulation.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formulation.category} • Brix:{" "}
                        {formulation.targetBrix ?? "—"} • pH:{" "}
                        {formulation.targetPH ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-xs font-medium text-blue-700">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatMoney(formulation.totalCostUSD)} • /kg{" "}
                      {formatMoney(formulation.costPerKgUSD)}
                    </div>
                    <div className="flex gap-1.5">
                      <Link
                        href={`/cogs?formulationId=${formulation.id}`}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:text-blue-700"
                      >
                        COGS
                      </Link>
                      <Link
                        href={`/formulations?formulationId=${formulation.id}`}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-violet-300 hover:text-violet-700"
                      >
                        Edit
                      </Link>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
