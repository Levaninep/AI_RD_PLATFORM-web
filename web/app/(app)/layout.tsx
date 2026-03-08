import { AppShell } from "@/components/layout/AppShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin-auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let showAdmin = false;

  try {
    const session = await getServerSession(authOptions);
    showAdmin = isAdminSession(session);
  } catch {
    showAdmin = false;
  }

  return <AppShell showAdmin={showAdmin}>{children}</AppShell>;
}
