import Link from "next/link";

export default function SpecificationsPage() {
  return (
    <main>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Specifications
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Keep target quality specifications for brix, acidity, and density
            control.
          </p>
        </div>

        <Link
          href="/formulations"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Open Formulation Builder
        </Link>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-500">
          Specification templates are managed through formulation workflows in
          this MVP.
          <div className="mt-2">
            <Link
              href="/formulations"
              className="font-medium text-blue-700 hover:text-blue-800"
            >
              Go to formulations and calculators
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
