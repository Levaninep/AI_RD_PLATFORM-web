"use client";

import Link from "next/link";
import { type ComponentType, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgeDollarSign,
  Beaker,
  Bookmark,
  Database,
  FlaskConical,
  Flame,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Percent,
  Plus,
  Settings,
  TestTube2,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  children?: Array<{ href: string; label: string; icon: NavItem["icon"] }>;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/formulations",
    label: "Formulations",
    icon: FlaskConical,
    children: [
      {
        href: "/formulations",
        label: "Create Recipe",
        icon: FlaskConical,
      },
      {
        href: "/saved-formulas",
        label: "Saved Formulations",
        icon: Bookmark,
      },
    ],
  },
  {
    href: "/calculators",
    label: "Calculators",
    icon: Gauge,
    children: [
      { href: "/cogs", label: "COGS", icon: BadgeDollarSign },
      { href: "/calculators/juice", label: "Juice %", icon: Percent },
      {
        href: "/calculators/calories",
        label: "Calories",
        icon: Flame,
      },
      { href: "/calculators/co2", label: "CO₂ (g/L)", icon: TestTube2 },
      {
        href: "/calculators/brix-density",
        label: "Brix / Density",
        icon: Timer,
      },
    ],
  },
  { href: "/shelf-life", label: "Shelf-life", icon: Timer },
  { href: "/ingredients", label: "Ingredients Library", icon: Beaker },
  { href: "/activity", label: "Activity Log", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminNavItem: NavItem = {
  href: "/admin",
  label: "Admin",
  icon: Settings,
  children: [
    { href: "/admin/ingredients", label: "Ingredients", icon: Beaker },
    { href: "/admin/database", label: "Database", icon: Database },
  ],
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  collapsed,
  onToggle,
  onNavigate,
  showAdmin,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  showAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "/calculators":
      pathname.startsWith("/calculators") || pathname.startsWith("/cogs"),
    "/formulations":
      pathname.startsWith("/formulations") ||
      pathname.startsWith("/saved-formulas"),
    "/admin": pathname.startsWith("/admin"),
  });

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          "relative h-screen overflow-hidden transition-all",
          collapsed ? "w-20" : "w-60",
        )}
        style={{
          background:
            "linear-gradient(180deg, #2F54EB 0%, #243CCB 45%, #1D32B8 100%)",
          borderRadius: collapsed ? "0" : "0 26px 26px 0",
          boxShadow: "10px 0 30px rgba(59, 91, 255, 0.18)",
        }}
      >
        {/* Glossy lighting overlay */}
        <div
          className="pointer-events-none absolute -left-10 -top-10 h-52 w-52 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed ? (
            <div>
              <Link
                href="/"
                onClick={onNavigate}
                className="text-[15px] font-bold tracking-tight text-white hover:text-blue-200"
              >
                AI R&D Platform
              </Link>
              <p className="text-[11px] font-medium tracking-wide text-white/50">
                SaaS Workspace
              </p>
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="rounded-xl text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.08)]"
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4.5 transition-transform duration-200" />
            ) : (
              <PanelLeftClose className="size-4.5 transition-transform duration-200" />
            )}
          </Button>
        </div>

        <div className="mx-4 h-px bg-white/10" />

        <ScrollArea className="h-[calc(100vh-64px)] px-3 py-3">
          <nav className="space-y-0.5">
            {(showAdmin ? [...navItems, adminNavItem] : navItems).map(
              (item) => {
                if (item.children) {
                  const sectionOpen = openSections[item.href] ?? false;

                  return (
                    <div key={item.href} className="space-y-0.5">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setOpenSections((prev) => ({
                            ...prev,
                            [item.href]: !sectionOpen,
                          }))
                        }
                        className="group w-full justify-start gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/88 hover:bg-white/8 hover:text-white"
                      >
                        <item.icon className="size-4.5 opacity-80" />
                        {!collapsed ? <span>{item.label}</span> : null}
                        {!collapsed ? (
                          <span className="ml-auto flex size-4 items-center justify-center rounded-md bg-white/8 transition-all duration-200 group-hover:bg-white/14">
                            {sectionOpen ? (
                              <Minus
                                className="size-2.5 text-white/70 transition-all duration-200"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <Plus
                                className="size-2.5 text-white/50 transition-all duration-200"
                                strokeWidth={2.5}
                              />
                            )}
                          </span>
                        ) : null}
                      </Button>
                      {sectionOpen && !collapsed ? (
                        <div className="ml-5 space-y-0.5 border-l border-white/10 pl-3">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onNavigate}
                              className={cn(
                                "flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] transition-all",
                                isActive(pathname, child.href)
                                  ? "font-semibold text-white"
                                  : "text-white/72 hover:bg-white/8 hover:text-white",
                              )}
                              style={
                                isActive(pathname, child.href)
                                  ? {
                                      background: "rgba(59, 91, 255, 0.18)",
                                      border:
                                        "1px solid rgba(59, 91, 255, 0.25)",
                                      boxShadow:
                                        "0 0 16px rgba(59, 91, 255, 0.15)",
                                    }
                                  : undefined
                              }
                            >
                              <child.icon className="size-4 opacity-80" />
                              <span>{child.label}</span>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                }

                const content = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center rounded-xl px-3 py-2.5 text-[13px] transition-all",
                      collapsed ? "justify-center" : "gap-2.5",
                      isActive(pathname, item.href)
                        ? "font-semibold text-white"
                        : "text-white/88 hover:bg-white/8 hover:text-white",
                    )}
                    style={
                      isActive(pathname, item.href)
                        ? {
                            background: "rgba(59, 91, 255, 0.18)",
                            border: "1px solid rgba(59, 91, 255, 0.25)",
                            boxShadow: "0 0 16px rgba(59, 91, 255, 0.15)",
                          }
                        : undefined
                    }
                  >
                    <item.icon className="size-4.5 opacity-80" />
                    {!collapsed ? <span>{item.label}</span> : null}
                  </Link>
                );

                return collapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <div key={item.href}>{content}</div>
                );
              },
            )}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
}
