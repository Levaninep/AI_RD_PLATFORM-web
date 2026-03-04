export default function DashboardLoading() {
  return (
    <main className="py-6">
      <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mt-2 h-4 w-80 animate-pulse rounded bg-gray-100" />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`kpi-skeleton-${index}`}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-3 w-36 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={`list-skeleton-${index}`}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 5 }).map((__, rowIndex) => (
                <div
                  key={`row-skeleton-${index}-${rowIndex}`}
                  className="rounded-lg border border-gray-100 px-3 py-2"
                >
                  <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
                  <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
