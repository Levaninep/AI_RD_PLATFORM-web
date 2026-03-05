"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { TopHeader } from "@/components/layout/TopHeader";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const APP_ROUTES = [
  "/dashboard",
  "/ingredients",
  "/formulations",
  "/cogs",
  "/co2-calculations",
  "/reports",
  "/saved-formulas",
  "/shelf-life",
  "/suppliers",
  "/specifications",
  "/activity",
  "/settings",
  "/calculators",
  "/admin",
];

function isAppRoute(pathname: string) {
  return APP_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const showShell = useMemo(() => isAppRoute(pathname), [pathname]);

  useEffect(() => {
    let active = true;

    async function detectAdmin() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | {
              user?: { role?: string | null; email?: string | null };
            }
          | null;

        const isAdmin = data?.user?.role === "ADMIN";

        if (active) {
          setShowAdmin(isAdmin || pathname.startsWith("/admin"));
        }
      } catch {
        if (active) {
          setShowAdmin(pathname.startsWith("/admin"));
        }
      }
    }

    void detectAdmin();

    return () => {
      active = false;
    };
  }, [pathname]);

  if (!showShell) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:block">
        <SidebarNav
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          showAdmin={showAdmin}
        />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main application navigation</SheetDescription>
          </SheetHeader>
          <SidebarNav
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
            showAdmin={showAdmin}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "flex h-full min-w-0 flex-1 flex-col transition-[padding-left] duration-200",
          collapsed ? "md:pl-[88px]" : "md:pl-[280px]",
        )}
      >
        <TopHeader onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
