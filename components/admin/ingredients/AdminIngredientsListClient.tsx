"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type {
  AdminIngredient,
  AdminIngredientListResponse,
} from "@/components/admin/ingredients/types";
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

type SortBy = "updatedAt" | "name" | "price" | "brix";

type SortOrder = "asc" | "desc";

function getApiErrorMessage(data: unknown, fallback: string): string {
  if (
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error?: unknown }).error === "object" &&
    (data as { error?: unknown }).error !== null &&
    "message" in ((data as { error?: { message?: unknown } }).error ?? {}) &&
    typeof (data as { error?: { message?: string } }).error?.message ===
      "string"
  ) {
    return (
      (data as { error?: { message?: string } }).error?.message ?? fallback
    );
  }

  return fallback;
}

const categories = [
  "",
  "Sweetener",
  "Juice",
  "Acid",
  "Flavor",
  "Extract",
  "Other",
];

export default function AdminIngredientsListClient() {
  const router = useRouter();
  const [items, setItems] = useState<AdminIngredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [vegan, setVegan] = useState("all");
  const [natural, setNatural] = useState("all");
  const [co2Relevant, setCo2Relevant] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminIngredient | null>(
    null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          q: search,
          page: String(page),
          limit: String(limit),
          sortBy,
          sortOrder,
          vegan,
          natural,
          co2Relevant,
        });

        if (category) {
          params.set("category", category);
        }

        const response = await fetch(
          `/api/admin/ingredients?${params.toString()}`,
          {
            cache: "no-store",
          },
        );
        const data = (await response.json().catch(() => ({}))) as
          | AdminIngredientListResponse
          | { error?: { message?: string } };

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(data, "Failed to load ingredients."),
          );
        }

        const parsed = data as AdminIngredientListResponse;
        setItems(parsed.items ?? []);
        setTotalPages(parsed.totalPages ?? 1);
        setTotal(parsed.total ?? 0);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load ingredients.",
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [
    search,
    page,
    limit,
    sortBy,
    sortOrder,
    category,
    vegan,
    natural,
    co2Relevant,
  ]);

  const sortOptions = useMemo(
    () => [
      { label: "UpdatedAt desc", value: "updatedAt:desc" },
      { label: "Name asc", value: "name:asc" },
      { label: "Price asc", value: "price:asc" },
      { label: "Price desc", value: "price:desc" },
      { label: "Brix asc", value: "brix:asc" },
      { label: "Brix desc", value: "brix:desc" },
    ],
    [],
  );

  async function deleteIngredient() {
    if (!deleteTarget) return;

    const optimistic = items.filter((item) => item.id !== deleteTarget.id);
    setItems(optimistic);

    const response = await fetch(`/api/admin/ingredients/${deleteTarget.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(getApiErrorMessage(data, "Delete failed."));
      setDeleteOpen(false);
      return;
    }

    setToast("Ingredient deleted.");
    setDeleteOpen(false);
    setDeleteTarget(null);
    setPage(1);
  }

  function startDelete(item: AdminIngredient) {
    setDeleteTarget(item);
    setDeleteOpen(true);
  }

  async function duplicateIngredient(item: AdminIngredient) {
    const response = await fetch("/api/admin/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredientName: `Copy of ${item.ingredientName}`,
        category: item.category,
        supplier: item.supplier,
        countryOfOrigin: item.countryOfOrigin,
        pricePerKgEur: item.pricePerKgEur,
        densityKgPerL: item.densityKgPerL,
        brixPercent: item.brixPercent,
        singleStrengthBrix: item.singleStrengthBrix,
        titratableAcidityPercent: item.titratableAcidityPercent,
        pH: item.pH,
        waterContentPercent: item.waterContentPercent,
        shelfLifeMonths: item.shelfLifeMonths,
        storageConditions: item.storageConditions,
        allergenInfo: item.allergenInfo,
        vegan: item.vegan,
        natural: item.natural,
        co2SolubilityRelevant: item.co2SolubilityRelevant,
        notes: item.notes,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(getApiErrorMessage(data, "Duplicate failed."));
      return;
    }

    setToast("Duplicate created. Rename required.");
    const created = data as AdminIngredient;
    if (created?.id) {
      router.push(`/admin/ingredients/${created.id}`);
      router.refresh();
      return;
    }

    setPage(1);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-350 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Admin · Ingredients
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage static ingredient specifications and commercial data.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/ingredients/new"
              className="rounded bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800"
            >
              Add Ingredient
            </Link>
            <Link
              href="/admin/ingredients/import"
              className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Import Excel
            </Link>
            <Link
              href="/admin/ingredients/export"
              className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Export CSV
            </Link>
          </div>
        </div>

        {toast ? (
          <div className="mb-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {toast}
          </div>
        ) : null}
        {error ? (
          <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-4 grid gap-3 md:grid-cols-6">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search ingredient name"
            className="rounded border border-slate-300 px-3 py-2 text-sm md:col-span-2"
          />

          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {categories.map((entry) => (
              <option key={entry || "all"} value={entry}>
                {entry || "All categories"}
              </option>
            ))}
          </select>

          <select
            value={vegan}
            onChange={(event) => {
              setVegan(event.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Vegan: all</option>
            <option value="true">Vegan: true</option>
            <option value="false">Vegan: false</option>
          </select>

          <select
            value={natural}
            onChange={(event) => {
              setNatural(event.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">Natural: all</option>
            <option value="true">Natural: true</option>
            <option value="false">Natural: false</option>
          </select>

          <select
            value={co2Relevant}
            onChange={(event) => {
              setCo2Relevant(event.target.value);
              setPage(1);
            }}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">CO₂: all</option>
            <option value="true">CO₂: true</option>
            <option value="false">CO₂: false</option>
          </select>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-600">Total: {total}</div>
          <div className="flex gap-2">
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(event) => {
                const [nextSortBy, nextSortOrder] = event.target.value.split(
                  ":",
                ) as [SortBy, SortOrder];
                setSortBy(nextSortBy);
                setSortOrder(nextSortOrder);
                setPage(1);
              }}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={String(limit)}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2">Price/kg</th>
                <th className="px-3 py-2">Density</th>
                <th className="px-3 py-2">Brix</th>
                <th className="px-3 py-2">Single Strength Brix</th>
                <th className="px-3 py-2">Acidity</th>
                <th className="px-3 py-2">Vegan</th>
                <th className="px-3 py-2">Natural</th>
                <th className="px-3 py-2">CO₂</th>
                <th className="px-3 py-2">UpdatedAt</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    No ingredients found.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">
                        {item.ingredientName}
                      </div>
                      {item.hasOverrides ? (
                        <span className="mt-1 inline-flex rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                          Has overrides
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{item.category}</td>
                    <td className="px-3 py-2">{item.supplier}</td>
                    <td className="px-3 py-2">
                      {item.pricePerKgEur.toFixed(2)} €
                    </td>
                    <td className="px-3 py-2">{item.densityKgPerL ?? "—"}</td>
                    <td className="px-3 py-2">{item.brixPercent ?? "—"}</td>
                    <td className="px-3 py-2">
                      {item.singleStrengthBrix ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {item.titratableAcidityPercent ?? "—"}
                    </td>
                    <td className="px-3 py-2">{item.vegan ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">{item.natural ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">
                      {item.co2SolubilityRelevant ? "Yes" : "No"}
                    </td>
                    <td className="px-3 py-2">
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/ingredients/${item.id}`}
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => void duplicateIngredient(item)}
                          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => startDelete(item)}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ingredient</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Delete ${deleteTarget.ingredientName}? This is blocked if used in formulations.`
                : "Delete ingredient?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void deleteIngredient()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
