"use client";

import { useEffect, useState } from "react";
import IngredientAdminForm from "@/components/admin/ingredients/IngredientAdminForm";
import type { AdminIngredient } from "@/components/admin/ingredients/types";

export default function EditIngredientClient({ id }: { id: string }) {
  const [ingredient, setIngredient] = useState<AdminIngredient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/ingredients/${id}`, {
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error?.message ?? "Failed to load ingredient.");
        }

        setIngredient(data as AdminIngredient);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load ingredient.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-6">
        <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm text-slate-600">
          Loading ingredient...
        </div>
      </main>
    );
  }

  if (error || !ingredient) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-6">
        <div className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error ?? "Ingredient not found."}
        </div>
      </main>
    );
  }

  return <IngredientAdminForm mode="edit" initialData={ingredient} />;
}
