import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminSession, isDevAuthBypassEnabled } from "@/lib/admin-auth";

export default async function AdminIngredientsExportStubPage() {
  let session = null;

  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }

  if (!session && !isDevAuthBypassEnabled()) {
    redirect("/login?callbackUrl=/admin/ingredients/export");
  }

  if (!isAdminSession(session)) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
          403 · Admin access required.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Export CSV</h1>
        <p className="mt-2 text-sm">
          CSV export is available via API and now includes Single Strength Brix
          for juice content calculations.
        </p>
        <a
          href="/api/admin/ingredients/export"
          className="mt-3 inline-flex rounded bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800"
        >
          Download CSV
        </a>
        <Link
          href="/admin/ingredients"
          className="mt-4 inline-flex rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
        >
          Back to Ingredients Admin
        </Link>
      </div>
    </main>
  );
}
