import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession, isDevAuthBypassEnabled } from "@/lib/admin-auth";
import AdminDatabaseClient from "@/components/admin/AdminDatabaseClient";

export const dynamic = "force-dynamic";

export default async function AdminDatabasePage() {
  let session = null;

  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }

  if (!session && !isDevAuthBypassEnabled()) {
    redirect("/login?callbackUrl=/admin/database");
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Database Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Live view of all tables and records in the database.
          </p>
        </div>
      </div>
      <AdminDatabaseClient />
    </div>
  );
}
