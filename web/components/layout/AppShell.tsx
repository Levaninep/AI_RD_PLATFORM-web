"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  "/chat",
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
  showAdmin,
  userName,
  userEmail,
}: {
  children: ReactNode;
  showAdmin?: boolean;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const showShell = useMemo(() => isAppRoute(pathname), [pathname]);

  if (!showShell) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background:
          "linear-gradient(135deg, #F4F8FF 0%, #E9F1FF 45%, #DCE8FF 100%)",
      }}
    >
      {/* Cinematic background layers */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* Large top-left white-blue glow */}
        <div
          className="absolute -left-24 -top-20 h-150 w-175"
          style={{
            background:
              "radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.6) 0%, rgba(200,220,255,0.2) 50%, transparent 80%)",
            filter: "blur(80px)",
          }}
        />
        {/* Upper-right curved wave glow */}
        <div
          className="absolute -right-32 -top-10 h-125 w-150"
          style={{
            background:
              "radial-gradient(ellipse at 70% 20%, rgba(180,200,255,0.3) 0%, rgba(200,215,255,0.1) 45%, transparent 75%)",
            filter: "blur(70px)",
          }}
        />
        {/* Lower-left depth haze */}
        <div
          className="absolute -left-16 bottom-0 h-100 w-125"
          style={{
            background:
              "radial-gradient(ellipse at 20% 80%, rgba(210,225,255,0.2) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Center luminous wash */}
        <div
          className="absolute left-1/3 top-1/4 h-112.5 w-150"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
        {/* Bottom-right soft fade */}
        <div
          className="absolute -bottom-10 -right-20 h-80 w-112.5"
          style={{
            background:
              "radial-gradient(ellipse at 80% 90%, rgba(240,245,255,0.4) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      <div className="fixed left-0 top-0 z-30 hidden h-screen md:block">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          showAdmin={showAdmin}
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
            showAdmin={showAdmin}
          />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "relative z-10 min-w-0 transition-[margin-left] duration-300",
          collapsed ? "md:ml-20" : "md:ml-60",
        )}
      >
        <Topbar
          onOpenMobile={() => setMobileOpen(true)}
          userName={userName}
          userEmail={userEmail}
        />
        <main className="mx-auto w-full max-w-375 p-4 pb-10 md:p-6 md:pb-14">
          {children}
        </main>
      </div>
    </div>
  );
}
