import Link from "next/link";

export default function SuppliersPage() {
  return (
    <main>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Suppliers</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage supplier profiles and sourcing contacts for ingredients.
          </p>
        </div>

        <button
          type="button"
          disabled
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white opacity-60"
        >
          Add Supplier
        </button>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
          Supplier module placeholder for the MVP.
          <div className="mt-2">
            <Link
              href="/ingredients"
              className="font-medium text-blue-700 hover:text-blue-800"
            >
              Manage ingredients database
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
