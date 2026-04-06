import { AppShell } from "@/components/layout/AppShell";
import { GuestGate } from "@/components/layout/GuestGate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminSession } from "@/lib/admin-auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let showAdmin = false;
  let isGuest = true;
  let userName: string | undefined;
  let userEmail: string | undefined;

  try {
    const session = await getServerSession(authOptions);
    showAdmin = isAdminSession(session);
    isGuest = !session;
    userName = session?.user?.name ?? undefined;
    userEmail = session?.user?.email ?? undefined;
  } catch {
    showAdmin = false;
    isGuest = true;
  }

  return (
    <AppShell showAdmin={showAdmin} userName={userName} userEmail={userEmail}>
      <GuestGate isGuest={isGuest}>{children}</GuestGate>
    </AppShell>
  );
}
