import { AppShell } from "@/components/layout/AppShell";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_SIDEBAR_EMAIL = "l.nepharidze@gmail.com";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let showAdmin = false;

  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.trim().toLowerCase();
    showAdmin = email === ADMIN_SIDEBAR_EMAIL;
  } catch {
    showAdmin = false;
  }

  return <AppShell showAdmin={showAdmin}>{children}</AppShell>;
}
