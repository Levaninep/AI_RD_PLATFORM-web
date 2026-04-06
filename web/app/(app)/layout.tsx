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

  try {
    const session = await getServerSession(authOptions);
    showAdmin = isAdminSession(session);
    isGuest = !session;
  } catch {
    showAdmin = false;
    isGuest = true;
  }

  return (
    <AppShell showAdmin={showAdmin}>
      <GuestGate isGuest={isGuest}>{children}</GuestGate>
    </AppShell>
  );
}
