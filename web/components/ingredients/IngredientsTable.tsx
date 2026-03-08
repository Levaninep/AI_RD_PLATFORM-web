"use client";

import type { Ingredient } from "@/lib/types";

type IngredientsTableProps = {
  items: Ingredient[];
  loading: boolean;
  busy: boolean;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (ingredient: Ingredient) => void;
  onDuplicate: (ingredient: Ingredient) => void;
};

function text(value: number | null | undefined, digits = 2) {
  return value == null ? "—" : value.toFixed(digits);
}

export default function IngredientsTable({
  items,
  loading,
  busy,
  onEdit,
  onDelete,
  onDuplicate,
}: IngredientsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-blue-100 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-blue-50 text-left text-slate-700">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Category</th>
            <th className="px-3 py-2 font-medium">Supplier</th>
            <th className="px-3 py-2 font-medium">Price/kg (EUR)</th>
            <th className="px-3 py-2 font-medium">Brix</th>
            <th className="px-3 py-2 font-medium">Single Strength Brix</th>
            <th className="px-3 py-2 font-medium">Acidity</th>
            <th className="px-3 py-2 font-medium">Vegan</th>
            <th className="px-3 py-2 font-medium">Natural</th>
            <th className="px-3 py-2 font-medium">CO₂ Relevant</th>
            <th className="px-3 py-2 font-medium">Updated At</th>
            <th className="px-3 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(8)].map((_, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="px-3 py-2" colSpan={12}>
                  <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                </td>
              </tr>
            ))
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={12} className="px-3 py-8 text-center text-slate-500">
                No ingredients found.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-3 py-2 font-medium text-slate-900">
                  {item.ingredientName}
                </td>
                <td className="px-3 py-2">{item.category}</td>
                <td className="px-3 py-2">{item.supplier}</td>
                <td className="px-3 py-2">
                  {text(
                    item.effectivePricePerKgEur ??
                      item.pricePerKgEur ??
                      item.pricePerKg,
                  )}
                </td>
                <td className="px-3 py-2">
                  {text(item.brixPercent ?? item.brix)}
                </td>
                <td className="px-3 py-2">{text(item.singleStrengthBrix)}</td>
                <td className="px-3 py-2">
                  {text(
                    item.titratableAcidityPercent ?? item.titratableAcidity,
                  )}
                </td>
                <td className="px-3 py-2">{item.vegan ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{item.natural ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  {item.co2SolubilityRelevant ? "Yes" : "No"}
                </td>
                <td className="px-3 py-2">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                      onClick={() => onEdit(item)}
                      disabled={busy}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded border border-slate-300 px-2 py-1 text-xs"
                      onClick={() => onDuplicate(item)}
                      disabled={busy}
                    >
                      Duplicate
                    </button>
                    <button
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                      onClick={() => onDelete(item)}
                      disabled={busy}
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
  );
}
