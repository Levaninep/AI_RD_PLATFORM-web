import type { Ingredient as IngredientModel } from "@/lib/types";

type DeleteIngredientDialogProps = {
  open: boolean;
  busy: boolean;
  ingredient: IngredientModel | null;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteIngredientDialog({
  open,
  busy,
  ingredient,
  onCancel,
  onConfirm,
}: DeleteIngredientDialogProps) {
  if (!open || !ingredient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-gray-900">Are you sure?</h2>
        <p className="mt-2 text-sm text-gray-600">
          This will permanently delete{" "}
          <span className="font-medium">{ingredient.ingredientName}</span>.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Deleting..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
