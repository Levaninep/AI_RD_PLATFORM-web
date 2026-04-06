"use client";

import { useEffect, useState } from "react";

type Counts = {
  users: number;
  ingredients: number;
  formulations: number;
  formulationIngredients: number;
  ingredientOverrides: number;
  shelfLifeTests: number;
  samplingEvents: number;
  testResults: number;
  co2LossTests: number;
  activityLogs: number;
  savedCalories: number;
};

type UserRow = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  _count: { formulations: number; savedCalories: number };
};

type IngredientRow = {
  id: string;
  ingredientName: string;
  category: string;
  supplier: string;
  pricePerKgEur: number;
  vegan: boolean;
  natural: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormulationRow = {
  id: string;
  name: string;
  category: string;
  userId: string | null;
  targetBrix: number | null;
  targetPH: number | null;
  createdAt: string;
  updatedAt: string;
  user: { email: string } | null;
  _count: { ingredients: number; shelfLifeTests: number };
};

type ShelfLifeRow = {
  id: string;
  testNumber: string;
  productName: string;
  status: string;
  startDate: string;
  createdAt: string;
};

type DbData = {
  counts: Counts;
  users: UserRow[];
  ingredients: IngredientRow[];
  formulations: FormulationRow[];
  shelfLifeTests: ShelfLifeRow[];
};

type ActiveTab =
  | "overview"
  | "users"
  | "ingredients"
  | "formulations"
  | "shelfLife";

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}

function StatCard({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </button>
  );
}

export default function AdminDatabaseClient() {
  const [data, setData] = useState<DbData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ActiveTab>("overview");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/database", { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ?? `HTTP ${res.status}`,
          );
        }
        setData((await res.json()) as DbData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-slate-500">Loading database info…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const { counts } = data;

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "users", label: `Users (${counts.users})` },
    { key: "ingredients", label: `Ingredients (${counts.ingredients})` },
    { key: "formulations", label: `Formulations (${counts.formulations})` },
    { key: "shelfLife", label: `Shelf-life (${counts.shelfLifeTests})` },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Users"
            value={counts.users}
            onClick={() => setTab("users")}
          />
          <StatCard
            label="Ingredients"
            value={counts.ingredients}
            onClick={() => setTab("ingredients")}
          />
          <StatCard
            label="Formulations"
            value={counts.formulations}
            onClick={() => setTab("formulations")}
          />
          <StatCard
            label="Formulation Lines"
            value={counts.formulationIngredients}
          />
          <StatCard
            label="Ingredient Overrides"
            value={counts.ingredientOverrides}
          />
          <StatCard
            label="Shelf-life Tests"
            value={counts.shelfLifeTests}
            onClick={() => setTab("shelfLife")}
          />
          <StatCard label="Sampling Events" value={counts.samplingEvents} />
          <StatCard label="Test Results" value={counts.testResults} />
          <StatCard label="CO₂ Loss Tests" value={counts.co2LossTests} />
          <StatCard label="Activity Logs" value={counts.activityLogs} />
          <StatCard label="Saved Calories Calcs" value={counts.savedCalories} />
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div className="overflow-x-auto rounded border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Formulations</th>
                <th className="px-3 py-2">Saved Calories</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.users.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-slate-400"
                  >
                    No users registered yet.
                  </td>
                </tr>
              ) : (
                data.users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {u.email}
                    </td>
                    <td className="px-3 py-2">{u._count.formulations}</td>
                    <td className="px-3 py-2">{u._count.savedCalories}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {fmt(u.createdAt)}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {fmt(u.updatedAt)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        className="rounded bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 border border-red-200"
                        title="Delete user"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Delete user ${u.email}? This cannot be undone. The user will need to register again to access the platform.`,
                            )
                          )
                            return;
                          try {
                            const res = await fetch(
                              `/api/admin/users/${u.id}`,
                              { method: "DELETE" },
                            );
                            if (!res.ok) {
                              const body = await res.json().catch(() => ({}));
                              throw new Error(
                                body?.error?.message || `HTTP ${res.status}`,
                              );
                            }
                            // Refresh data
                            setData(
                              (prev) =>
                                prev && {
                                  ...prev,
                                  users: prev.users.filter(
                                    (user) => user.id !== u.id,
                                  ),
                                  counts: {
                                    ...prev.counts,
                                    users: prev.counts.users - 1,
                                  },
                                },
                            );
                          } catch (err) {
                            alert(
                              `Failed to delete user: ${err instanceof Error ? err.message : err}`,
                            );
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Ingredients tab */}
      {tab === "ingredients" && (
        <div className="overflow-x-auto rounded border border-slate-200">
          <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Showing latest 50 of {counts.ingredients}
          </p>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">Supplier</th>
                <th className="px-3 py-2">Price/kg (€)</th>
                <th className="px-3 py-2">Vegan</th>
                <th className="px-3 py-2">Natural</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.ingredients.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-slate-400"
                  >
                    No ingredients yet.
                  </td>
                </tr>
              ) : (
                data.ingredients.map((ing) => (
                  <tr
                    key={ing.id}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {ing.ingredientName}
                    </td>
                    <td className="px-3 py-2">{ing.category}</td>
                    <td className="px-3 py-2">{ing.supplier}</td>
                    <td className="px-3 py-2">
                      {ing.pricePerKgEur.toFixed(2)}
                    </td>
                    <td className="px-3 py-2">{ing.vegan ? "✓" : "–"}</td>
                    <td className="px-3 py-2">{ing.natural ? "✓" : "–"}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {fmt(ing.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulations tab */}
      {tab === "formulations" && (
        <div className="overflow-x-auto rounded border border-slate-200">
          <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Showing latest 50 of {counts.formulations}
          </p>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Brix</th>
                <th className="px-3 py-2">pH</th>
                <th className="px-3 py-2">Ingredients</th>
                <th className="px-3 py-2">Tests</th>
                <th className="px-3 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.formulations.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-6 text-center text-slate-400"
                  >
                    No formulations yet.
                  </td>
                </tr>
              ) : (
                data.formulations.map((f) => (
                  <tr
                    key={f.id}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {f.name}
                    </td>
                    <td className="px-3 py-2">{f.category}</td>
                    <td className="px-3 py-2">{f.user?.email ?? "—"}</td>
                    <td className="px-3 py-2">
                      {f.targetBrix?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {f.targetPH?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-3 py-2">{f._count.ingredients}</td>
                    <td className="px-3 py-2">{f._count.shelfLifeTests}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {fmt(f.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Shelf-life tab */}
      {tab === "shelfLife" && (
        <div className="overflow-x-auto rounded border border-slate-200">
          <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Showing latest 50 of {counts.shelfLifeTests}
          </p>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-700">
              <tr>
                <th className="px-3 py-2">Test #</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Start Date</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.shelfLifeTests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-slate-400"
                  >
                    No shelf-life tests yet.
                  </td>
                </tr>
              ) : (
                data.shelfLifeTests.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {t.testNumber}
                    </td>
                    <td className="px-3 py-2">{t.productName}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                          t.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : t.status === "IN_PROGRESS"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {fmt(t.startDate)}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {fmt(t.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
