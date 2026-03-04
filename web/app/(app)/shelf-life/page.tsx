"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
    <main className="py-6">
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 shadow">
          {toast}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Shelf-Life Tests
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Plan, execute, and document shelf-life validation with
            procedure-based timelines.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/shelf-life/activity"
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Activity Logs
          </Link>
          <Link
            href="/shelf-life/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create New Test
          </Link>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Status
        </label>
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "ALL" | ShelfLifeStatus)
          }
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        >
          <option value="ALL">All</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          Loading shelf-life tests...
        </div>
      ) : sortedRows.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
          No shelf-life tests yet.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full min-w-180 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-3 py-2">Product Name</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Last Updated</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-900">
                    {row.productName}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {getTestTypeLabel(row)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${businessStatusBadgeClass(getBusinessStatus(row))}`}
                    >
                      {getBusinessStatus(row)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    {formatDate(row.updatedAt)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="inline-flex gap-2">
                      <Link
                        href={`/shelf-life/${row.id}`}
                        className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Open
                      </Link>
                      <Link
                        href={`/shelf-life/activity?testId=${encodeURIComponent(row.id)}`}
                        className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Activity
                      </Link>
                      <Button
                        variant="destructive"
                        className="px-2 py-1 text-xs"
                        onClick={() => setPendingDelete(row)}
                        disabled={deletingId === row.id}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
                Are you sure you want to delete “{pendingDelete.productName}”?
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
