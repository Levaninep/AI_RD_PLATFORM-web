import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-semibold">AI R&amp;D Platform</h1>
      <p className="mt-2 text-gray-600">
        Digital workspace for formulations, ingredients, and cost calculations.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/ingredients"
          className="rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Ingredients
        </Link>
        <Link
          href="/formulations"
          className="rounded-lg border px-4 py-2 hover:bg-gray-50"
        >
          Formulations
        </Link>
      </div>
    </main>
  );
}
