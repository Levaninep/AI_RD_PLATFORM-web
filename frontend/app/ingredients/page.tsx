"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Ingredient = {
  id: string;
  name: string;
  category: string;
  pricePerKg: number;
  supplier: string | null;
  density: number | null;
  createdAt: string;
  updatedAt: string;
};

type ApiError = { error?: { message?: string } };

type FormState = {
  name: string;
  category: string;
  pricePerKg: string; // keep as string for controlled input
  supplier: string;
  density: string;
};

const CATEGORIES = [
  "Sweeteners",
  "Juices",
  "Acids",
  "Flavors",
  "Extracts",
  "Other",
] as const;

function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Unexpected error occurred";
}

async function readJsonSafe<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function normalizeNumberInput(value: string) {
  // allows "1", "1.", "1.2", also handles commas
  return value.replace(",", ".").trim();
}

function buildPayloadOrThrow(form: FormState) {
  const name = form.name.trim();

  if (!name) {
    throw new Error("Name is required.");
  }

  if (name.length > 100) {
    throw new Error("Name must be under 100 characters.");
  }

  const category = (form.category || "Other").trim() || "Other";

  const priceStr = normalizeNumberInput(form.pricePerKg);
  const pricePerKg = Number(priceStr);
  if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
    throw new Error("Price per kg must be a valid number (0 or greater).");
  }

  const supplier = form.supplier.trim();
  const densityStr = normalizeNumberInput(form.density);
  const density = densityStr ? Number(densityStr) : null;

  if (density != null && (!Number.isFinite(density) || density <= 0)) {
    throw new Error("Density must be a valid number greater than 0.");
  }

  return {
    name,
    category,
    pricePerKg,
    supplier: supplier ? supplier : null,
    density,
  };
}

export default function IngredientsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    category: "Other",
    pricePerKg: "",
    supplier: "",
    density: "",
  });

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({
      name: "",
      category: "Other",
      pricePerKg: "",
      supplier: "",
      density: "",
    });
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    resetForm();
    setError(null);
  }, [resetForm]);

  const openCreate = useCallback(() => {
    resetForm();
    setError(null);
    setIsModalOpen(true);
  }, [resetForm]);

  const openEdit = useCallback((x: Ingredient) => {
    setEditingId(x.id);
    setForm({
      name: x.name,
      category: x.category || "Other",
      pricePerKg: String(x.pricePerKg),
      supplier: x.supplier ?? "",
      density: x.density == null ? "" : String(x.density),
    });
    setError(null);
    setIsModalOpen(true);
  }, []);

  const loadIngredients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ingredients", { cache: "no-store" });
      const data = await readJsonSafe<Ingredient[] | ApiError>(res);

      if (!res.ok) {
        const msg =
          (data as ApiError | null)?.error?.message ||
          `Failed to load (HTTP ${res.status})`;
        throw new Error(msg);
      }

      setItems((data as Ingredient[]) ?? []);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIngredients();
  }, [loadIngredients]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((x) =>
        categoryFilter === "All" ? true : x.category === categoryFilter,
      )
      .filter((x) => {
        if (!q) return true;
        return (
          x.name.toLowerCase().includes(q) ||
          x.category.toLowerCase().includes(q) ||
          (x.supplier ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, query, categoryFilter]);

  const saveIngredient = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const payload = buildPayloadOrThrow(form);

      const res = await fetch(
        editingId ? `/api/ingredients/${editingId}` : "/api/ingredients",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const data = await readJsonSafe<Ingredient | ApiError>(res);

      if (!res.ok) {
        const msg =
          (data as ApiError | null)?.error?.message ||
          `Save failed (HTTP ${res.status})`;
        throw new Error(msg);
      }

      // Fast UI update without full reload
      const saved = data as Ingredient;
      setItems((prev) => {
        const exists = prev.some((x) => x.id === saved.id);
        return exists
          ? prev.map((x) => (x.id === saved.id ? saved : x))
          : [saved, ...prev];
      });

      closeModal();
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }, [editingId, closeModal, form]);

  const deleteIngredient = useCallback(
    async (id: string) => {
      const target = items.find((x) => x.id === id);
      if (!target) return;

      const ok = window.confirm(`Delete ingredient "${target.name}"?`);
      if (!ok) return;

      setBusy(true);
      setError(null);

      try {
        const res = await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
        const data = await readJsonSafe<{ ok: boolean } | ApiError>(res);

        if (!res.ok) {
          const msg =
            (data as ApiError | null)?.error?.message ||
            `Delete failed (HTTP ${res.status})`;
          throw new Error(msg);
        }

        setItems((prev) => prev.filter((x) => x.id !== id));
      } catch (e: unknown) {
        setError(getErrorMessage(e));
      } finally {
        setBusy(false);
      }
    },
    [items],
  );

  return (
    <main className="min-h-screen bg-slate-50 py-6 px-4 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">
              Ingredients
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Persistent ingredient master data (Prisma + SQLite). Add pricing
              and optional density.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadIngredients}
              disabled={loading || busy}
              className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-blue-700 hover:bg-blue-100 disabled:opacity-60 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
            >
              ↻ Refresh
            </button>
            <button
              onClick={openCreate}
              disabled={busy}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60 dark:bg-green-700 dark:hover:bg-green-600"
            >
              + Add ingredient
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, category, supplier..."
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-700 dark:bg-slate-800 dark:text-white"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300">
            Showing: <span className="font-bold">{filtered.length}</span>
            {busy ? (
              <span className="ml-2 animate-pulse">(working…)</span>
            ) : null}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-200">
            ⚠️ {error}
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-xl border border-blue-200 shadow-lg dark:border-blue-700">
          <table className="w-full text-sm">
            <thead className="bg-linear-to-r from-blue-600 to-blue-700 text-left text-white dark:from-blue-900 dark:to-blue-800">
              <tr>
                <th className="px-4 py-4 font-semibold">Name</th>
                <th className="px-4 py-4 font-semibold">Category</th>
                <th className="px-4 py-4 font-semibold">Supplier</th>
                <th className="px-4 py-4 font-semibold">Price/kg</th>
                <th className="px-4 py-4 font-semibold">Density</th>
                <th className="px-4 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-slate-500"
                    colSpan={6}
                  >
                    ⟳ Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-slate-500"
                    colSpan={6}
                  >
                    No ingredients found.
                  </td>
                </tr>
              ) : (
                filtered.map((x) => (
                  <tr
                    key={x.id}
                    className="border-t border-blue-100 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {x.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                        {x.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {x.supplier ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400">
                      ${x.pricePerKg.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {x.density != null ? x.density : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(x)}
                          disabled={busy}
                          className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 disabled:opacity-60 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => deleteIngredient(x.id)}
                          disabled={busy}
                          className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-700 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            style={{ backdropFilter: "blur(2px)" }}
          >
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {editingId ? "Edit ingredient" : "Add ingredient"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Keep naming consistent — this becomes your master ingredient
                    database.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-700 dark:bg-slate-700 dark:text-white dark:placeholder-slate-500"
                    placeholder="e.g., Sugar"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value }))
                    }
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-700 dark:bg-slate-700 dark:text-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Price per kg
                  </label>
                  <input
                    value={form.pricePerKg}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, pricePerKg: e.target.value }))
                    }
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-700 dark:bg-slate-700 dark:text-white"
                    placeholder="e.g., 6.50"
                    inputMode="decimal"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Supplier (optional)
                  </label>
                  <input
                    value={form.supplier}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, supplier: e.target.value }))
                    }
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-700 dark:bg-slate-700 dark:text-white"
                    placeholder="e.g., EU Supplier"
                  />
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Density (optional)
                  </label>
                  <input
                    value={form.density}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, density: e.target.value }))
                    }
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-blue-700 dark:bg-slate-700 dark:text-white"
                    placeholder="e.g., 1.05"
                    inputMode="decimal"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900 dark:text-red-200">
                    ⚠️ {error}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <button
                    onClick={closeModal}
                    disabled={busy}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveIngredient}
                    disabled={busy}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-60 dark:bg-green-700 dark:hover:bg-green-600"
                  >
                    {busy ? "⟳ Saving…" : "✓ Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
