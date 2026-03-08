"use client";

import Link from "next/link";
import { type ComponentType, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgeDollarSign,
  Beaker,
  Bookmark,
  ChevronDown,
  FlaskConical,
  Flame,
  Gauge,
  LayoutDashboard,
  Percent,
  Settings,
  TestTube2,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  { href: "/ingredients", label: "Ingredients Library", icon: Beaker },
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
  { href: "/activity", label: "Activity Log", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

const adminNavItem: NavItem = {
  href: "/admin/ingredients",
  label: "Admin",
  icon: Settings,
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
  });

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          "h-screen border-r bg-sidebar transition-all",
          collapsed ? "w-20" : "w-[260px]",
        )}
      >
        <div className="flex h-16 items-center justify-between px-3">
          {!collapsed ? (
            <div>
              <Link
                href="/"
                onClick={onNavigate}
                className="text-sm font-semibold hover:underline"
              >
                AI R&D Platform
              </Link>
              <p className="text-xs text-muted-foreground">SaaS Workspace</p>
            </div>
          ) : null}
          <Button variant="ghost" size="icon" onClick={onToggle}>
            <ChevronDown
              className={cn(
                "size-4 transition",
                collapsed ? "-rotate-90" : "rotate-90",
              )}
            />
          </Button>
        </div>

        <Separator />

        <ScrollArea className="h-[calc(100vh-64px)] px-2 py-3">
          <nav className="space-y-1">
            {(showAdmin ? [...navItems, adminNavItem] : navItems).map(
              (item) => {
                if (item.children) {
                  const sectionOpen = openSections[item.href] ?? false;

                  return (
                    <div key={item.href} className="space-y-1">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setOpenSections((prev) => ({
                            ...prev,
                            [item.href]: !sectionOpen,
                          }))
                        }
                        className="w-full justify-start gap-2"
                      >
                        <item.icon className="size-4" />
                        {!collapsed ? <span>{item.label}</span> : null}
                        {!collapsed ? (
                          <ChevronDown
                            className={cn(
                              "ml-auto size-4 transition",
                              sectionOpen ? "rotate-180" : "rotate-0",
                            )}
                          />
                        ) : null}
                      </Button>
                      {sectionOpen && !collapsed ? (
                        <div className="ml-4 space-y-1 border-l pl-3">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onNavigate}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent",
                                isActive(pathname, child.href)
                                  ? "bg-accent font-medium"
                                  : "text-muted-foreground",
                              )}
                            >
                              <child.icon className="size-4" />
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
                      "flex items-center rounded-md px-3 py-2 text-sm transition hover:bg-accent",
                      collapsed ? "justify-center" : "gap-2",
                      isActive(pathname, item.href)
                        ? "bg-accent font-medium text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
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
