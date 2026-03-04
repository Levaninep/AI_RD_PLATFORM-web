import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminSession, isDevAuthBypassEnabled } from "@/lib/admin-auth";
import AdminIngredientsListClient from "@/components/admin/ingredients/AdminIngredientsListClient";

export const dynamic = "force-dynamic";

export default async function AdminIngredientsPage() {
  let session = null;

  try {
    session = await getServerSession(authOptions);
  } catch {
    session = null;
  }

  if (!session && !isDevAuthBypassEnabled()) {
    redirect("/login?callbackUrl=/admin/ingredients");
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

  return <AdminIngredientsListClient />;
}
