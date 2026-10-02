import { AppShell } from "@/components/layout/AppShell";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin-auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let showAdmin = false;
  let userName: string | undefined;
  let userEmail: string | undefined;
  let session = null;

  try {
    session = await getServerSession(authOptions);
    showAdmin = isAdminSession(session);
    userName = session?.user?.name ?? undefined;
    userEmail = session?.user?.email ?? undefined;
  } catch {
    showAdmin = false;
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell showAdmin={showAdmin} userName={userName} userEmail={userEmail}>
      {children}
    </AppShell>
  );
}
