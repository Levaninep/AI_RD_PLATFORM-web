"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import IngredientFormModal from "@/components/ingredients/IngredientFormModal";
import IngredientsTable from "@/components/ingredients/IngredientsTable";
import DeleteIngredientDialog from "@/components/ingredients/DeleteIngredientDialog";
import type { Ingredient } from "@/lib/types";

const CATEGORIES: Ingredient["category"][] = [
  "Sweetener",
  "Juice",
  "Acid",
  "Flavor",
  "Extract",
  "Other",
];

type PagedIngredients = {
  items: Ingredient[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ToggleFilter = "all" | "true" | "false";
type SortBy = "price" | "brix" | "updatedAt";

const EMPTY_PAGE: PagedIngredients = {
  items: [],
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
};

async function parseJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export default function IngredientsPage() {
  const [data, setData] = useState<PagedIngredients>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | Ingredient["category"]>(
    "all",
  );
  const [vegan, setVegan] = useState<ToggleFilter>("all");
  const [natural, setNatural] = useState<ToggleFilter>("all");
  const [co2Relevant, setCo2Relevant] = useState<ToggleFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [deleting, setDeleting] = useState<Ingredient | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (category !== "all") params.set("category", category);
    params.set("vegan", vegan);
    params.set("natural", natural);
    params.set("co2Relevant", co2Relevant);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    params.set("includeEffective", "true");
    params.set("scopeType", "global");
    params.set("page", String(page));
    params.set("limit", String(limit));
    return params.toString();
  }, [
    search,
    category,
    vegan,
    natural,
    co2Relevant,
    sortBy,
    sortOrder,
    page,
    limit,
  ]);

  const loadIngredients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ingredients?${query}`, {
        cache: "no-store",
      });
      const body = await parseJson<
        PagedIngredients | { error?: { message?: string } }
      >(response);
      if (!response.ok) {
        throw new Error(
          body && "error" in body
            ? body.error?.message || "Failed to load ingredients."
            : "Failed to load ingredients.",
        );
      }

      setData((body as PagedIngredients) ?? EMPTY_PAGE);
    } catch (fetchError) {
      setData(EMPTY_PAGE);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load ingredients.",
      );
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadIngredients();
  }, [loadIngredients]);

  async function saveIngredient(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const overrideThisIngredient = Boolean(payload.overrideThisIngredient);
      const isEdit = Boolean(editing);

      if (!isEdit && overrideThisIngredient) {
        throw new Error("Create ingredient first, then apply override.");
      }

      if (isEdit && overrideThisIngredient) {
        const overrideResponse = await fetch("/api/ingredient-overrides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ingredientId: editing!.id,
            scopeType: "global",
            overridePricePerKgEur: payload.pricePerKgEur ?? null,
            overrideDensityKgPerL: payload.densityKgPerL ?? null,
            overrideBrixPercent: payload.brixPercent ?? null,
            overrideTitratableAcidityPercent:
              payload.titratableAcidityPercent ?? null,
            overridePH: payload.pH ?? null,
            overrideWaterContentPercent: payload.waterContentPercent ?? null,
            notes: "Global ingredient override",
          }),
        });

        const overrideBody = await parseJson<{ error?: { message?: string } }>(
          overrideResponse,
        );

        if (!overrideResponse.ok) {
          throw new Error(
            overrideBody?.error?.message ||
              "Failed to save ingredient override.",
          );
        }

        await loadIngredients();
        setFormOpen(false);
        setEditing(null);
        return;
      }

      const cleanPayload = { ...payload } as Record<string, unknown>;
      delete cleanPayload.overrideThisIngredient;
      delete cleanPayload.autoCalculate;

      const response = await fetch(
        editing ? `/api/ingredients/${editing.id}` : "/api/ingredients",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cleanPayload),
        },
      );
      const body = await parseJson<{ error?: { message?: string } }>(response);

      if (!response.ok) {
        throw new Error(body?.error?.message || "Failed to save ingredient.");
      }

      setFormOpen(false);
      setEditing(null);
      await loadIngredients();
    } finally {
      setBusy(false);
    }
  }

  async function resetOverride(ingredient: Ingredient) {
    if (!ingredient.effectiveOverrideId) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(
        `/api/ingredient-overrides/${ingredient.effectiveOverrideId}`,
        { method: "DELETE" },
      );
      const body = await parseJson<{ error?: { message?: string } }>(response);

      if (!response.ok) {
        throw new Error(body?.error?.message || "Failed to reset override.");
      }

      await loadIngredients();
      setEditing(null);
      setFormOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/ingredients/${deleting.id}`, {
        method: "DELETE",
      });
      const body = await parseJson<{ error?: { message?: string } }>(response);
      if (!response.ok) {
        throw new Error(body?.error?.message || "Delete failed.");
      }

      setDeleting(null);
      await loadIngredients();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Delete failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function duplicateIngredient(item: Ingredient) {
    const duplicatePayload = {
      ...item,
      ingredientName: `${item.ingredientName} Copy`,
    };
    delete (duplicatePayload as { id?: string }).id;

    await saveIngredient(duplicatePayload);
  }

  return (
    <div className="space-y-5 p-6">
      <div className="rounded-xl border border-blue-100 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Ingredients</h1>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add Ingredient
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Search by name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as "all" | Ingredient["category"]);
              setPage(1);
            }}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={vegan}
            onChange={(e) => {
              setVegan(e.target.value as ToggleFilter);
              setPage(1);
            }}
          >
            <option value="all">Vegan: All</option>
            <option value="true">Vegan: Yes</option>
            <option value="false">Vegan: No</option>
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={natural}
            onChange={(e) => {
              setNatural(e.target.value as ToggleFilter);
              setPage(1);
            }}
          >
            <option value="all">Natural: All</option>
            <option value="true">Natural: Yes</option>
            <option value="false">Natural: No</option>
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={co2Relevant}
            onChange={(e) => {
              setCo2Relevant(e.target.value as ToggleFilter);
              setPage(1);
            }}
          >
            <option value="all">CO₂ Relevant: All</option>
            <option value="true">CO₂ Relevant: Yes</option>
            <option value="false">CO₂ Relevant: No</option>
          </select>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
          >
            <option value="price">Sort: Price</option>
            <option value="brix">Sort: Brix</option>
            <option value="updatedAt">Sort: Last Updated</option>
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          >
            <option value="desc">Order: Descending</option>
            <option value="asc">Order: Ascending</option>
          </select>
          <select
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <IngredientsTable
        items={data.items}
        loading={loading}
        busy={busy}
        onEdit={(ingredient) => {
          setEditing(ingredient);
          setFormOpen(true);
        }}
        onDelete={setDeleting}
        onDuplicate={(ingredient) => {
          void duplicateIngredient(ingredient);
        }}
      />

      <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm text-slate-700">
        <span>
          Showing {(data.page - 1) * data.limit + 1}-
          {Math.min(data.page * data.limit, data.total)} of {data.total}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
            disabled={data.page <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span>
            Page {data.page} / {data.totalPages}
          </span>
          <button
            className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
            disabled={data.page >= data.totalPages || loading}
            onClick={() =>
              setPage((prev) => Math.min(data.totalPages, prev + 1))
            }
          >
            Next
          </button>
        </div>
      </div>

      {formOpen ? (
        <IngredientFormModal
          open
          busy={busy}
          ingredient={editing}
          categories={CATEGORIES}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onResetOverride={
            editing
              ? async () => {
                  await resetOverride(editing);
                }
              : undefined
          }
          onSubmit={saveIngredient}
        />
      ) : null}

      <DeleteIngredientDialog
        open={Boolean(deleting)}
        busy={busy}
        ingredient={deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          void confirmDelete();
        }}
      />
    </div>
  );
}
