"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
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

export function AppShell({
  children,
  isAdmin,
}: {
  children: ReactNode;
  isAdmin?: boolean;
}) {
  void isAdmin;

  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const showShell = useMemo(() => isAppRoute(pathname), [pathname]);

  if (!showShell) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-muted/30 md:flex">
      <div className="hidden md:block">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
        />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-70 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Main application navigation</SheetDescription>
          </SheetHeader>
          <Sidebar
            collapsed={false}
            onToggle={() => setMobileOpen(false)}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-7xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
