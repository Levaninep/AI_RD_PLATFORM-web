"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  Timer,
  Plus,
  Activity,
  Eye,
  Trash2,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import type {
  ApiErrorResponse,
  ShelfLifeStatus,
  ShelfLifeTest,
} from "@/lib/shelf-life-types";

async function readJsonSafe<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function statusBadgeClass(status: ShelfLifeStatus): string {
  if (status === "COMPLETED") {
    return "bg-emerald-100 text-emerald-800";
  }

  if (status === "IN_PROGRESS") {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-amber-100 text-amber-800";
}

type BusinessStatus = "On Track" | "Needs Attention" | "Failed";

function getBusinessStatus(test: ShelfLifeTest): BusinessStatus {
  const recommendation = (test.finalRecommendation ?? "").toLowerCase();
  if (
    recommendation.includes("fail") ||
    recommendation.includes("reject") ||
    recommendation.includes("not approved")
  ) {
    return "Failed";
  }

  if (
    test.status !== "COMPLETED" &&
    test.nextSamplingEvent &&
    new Date(test.nextSamplingEvent.plannedDate) < new Date()
  ) {
    return "Needs Attention";
  }

  return "On Track";
}

function businessStatusBadgeClass(status: BusinessStatus): string {
  if (status === "Failed") {
    return "bg-red-100 text-red-700";
  }

  if (status === "Needs Attention") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-emerald-100 text-emerald-700";
}

function getTestTypeLabel(
  test: ShelfLifeTest,
): "Real-Time" | "Accelerated" | "Both" {
  const hasRealTime = test.conditions.some((item) => item.type === "REAL_TIME");
  const hasAccelerated = test.conditions.some(
    (item) => item.type === "ACCELERATED",
  );

  if (hasRealTime && hasAccelerated) {
    return "Both";
  }

  if (hasAccelerated) {
    return "Accelerated";
  }

  return "Real-Time";
}

export default function ShelfLifeListPage() {
  const [rows, setRows] = useState<ShelfLifeTest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ShelfLifeStatus>(
    "ALL",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ShelfLifeTest | null>(
    null,
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const loadTests = useCallback(async (status: "ALL" | ShelfLifeStatus) => {
    setLoading(true);
    setError(null);

    try {
      const query = status === "ALL" ? "" : `?status=${status}`;
      const response = await fetch(`/api/shelf-life${query}`, {
        cache: "no-store",
      });
      const data = await readJsonSafe<ShelfLifeTest[] | ApiErrorResponse>(
        response,
      );

      if (!response.ok) {
        throw new Error(
          (data as ApiErrorResponse | null)?.error?.message ||
            `Failed to load shelf-life tests (HTTP ${response.status}).`,
        );
      }

      setRows((data as ShelfLifeTest[]) ?? []);
    } catch (fetchError: unknown) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load tests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTests(statusFilter);
  }, [statusFilter, loadTests]);

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [rows],
  );

  async function confirmDelete() {
    if (!pendingDelete || deletingId) {
      return;
    }

    setDeletingId(pendingDelete.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/shelf-life-tests/${pendingDelete.id}`,
        {
          method: "DELETE",
        },
      );
      const data = await readJsonSafe<{ success?: boolean } | ApiErrorResponse>(
        response,
      );

      if (!response.ok) {
        throw new Error(
          (data as ApiErrorResponse | null)?.error?.message ||
            `Failed to delete test (HTTP ${response.status}).`,
        );
      }

      setRows((prev) => prev.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      showToast("Shelf-Life Test deleted successfully");
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete shelf-life test.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="relative py-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl" />
      </div>

      {/* Toast */}
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 shadow-lg">
          {toast}
        </div>
      ) : null}

      {/* Hero header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-teal-600 to-emerald-700 text-white shadow-lg shadow-teal-500/25">
              <Timer className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-teal-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-teal-700 uppercase">
              Stability
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Shelf-Life Tests
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            Plan, execute, and document shelf-life validation with
            procedure-based timelines.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/shelf-life/activity"
            className="group flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-teal-300 hover:text-teal-700 hover:shadow-md"
          >
            <Activity className="h-4 w-4" />
            Activity Logs
          </Link>
          <Link
            href="/shelf-life/new"
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-br from-teal-600 to-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition hover:shadow-xl hover:shadow-teal-500/30"
          >
            <Plus className="h-4 w-4" />
            Create New Test
          </Link>
        </div>
      </div>

      {/* Main workspace card */}
      <div className="cogs-workspace-card">
        {/* Filter bar */}
        <div className="cogs-selector-bar">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | ShelfLifeStatus)
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 focus:outline-none"
            >
              <option value="ALL">All</option>
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <span className="text-xs font-medium text-gray-400">
            {loading
              ? "Loading..."
              : `${sortedRows.length} test${sortedRows.length !== 1 ? "s" : ""}`}
          </span>
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
                Loading shelf-life tests...
              </p>
            </div>
          ) : sortedRows.length === 0 ? (
            <div className="cogs-empty-state">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-teal-100 to-emerald-100">
                <ClipboardList className="h-8 w-8 text-teal-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                No Shelf-Life Tests Yet
              </h3>
              <p className="max-w-sm text-sm text-gray-500">
                Create a new shelf-life test to start tracking product
                stability.
              </p>
              <Link
                href="/shelf-life/new"
                className="dashboard-cta-button mt-2 inline-flex items-center gap-1.5 px-6 py-2.5 text-sm"
              >
                <Plus className="h-4 w-4" />
                Create First Test
              </Link>
            </div>
          ) : (
            <div className="cogs-table-wrapper">
              <table className="w-full min-w-180 text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, index) => {
                    const bizStatus = getBusinessStatus(row);
                    return (
                      <tr
                        key={row.id}
                        className={`group transition hover:bg-teal-50/40 ${index < sortedRows.length - 1 ? "border-b border-gray-50" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-50 to-emerald-50 text-teal-600">
                              <Timer className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-semibold text-gray-900">
                              {row.productName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {getTestTypeLabel(row)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${businessStatusBadgeClass(bizStatus)}`}
                          >
                            {bizStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(row.updatedAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/shelf-life/${row.id}`}
                              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-teal-300 hover:text-teal-700"
                            >
                              <Eye className="h-3 w-3" />
                              Open
                            </Link>
                            <Link
                              href={`/shelf-life/activity?testId=${encodeURIComponent(row.id)}`}
                              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:text-blue-700"
                            >
                              <Activity className="h-3 w-3" />
                              Activity
                            </Link>
                            <button
                              type="button"
                              className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                              onClick={() => setPendingDelete(row)}
                              disabled={deletingId === row.id}
                            >
                              <Trash2 className="h-3 w-3" />
                              {deletingId === row.id ? "..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Shelf-Life Test?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All results and timepoints related
              to this test will be permanently removed.
            </AlertDialogDescription>
            {pendingDelete ? (
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;
                {pendingDelete.productName}&rdquo;?
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingId)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDelete()}
              disabled={Boolean(deletingId)}
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
