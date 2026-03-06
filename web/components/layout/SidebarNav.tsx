"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Beaker,
  FlaskConical,
  Gauge,
  Leaf,
  Settings,
  Sparkles,
  LayoutDashboard,
  TestTube2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ingredients", label: "Ingredients", icon: Beaker },
  { href: "/formulations", label: "Formulations", icon: FlaskConical },
  { href: "/shelf-life", label: "Shelf-Life", icon: TestTube2 },
  { href: "/co2-calculations", label: "CO₂ Calculator", icon: Gauge },
  { href: "/calculators/brix-density", label: "Brix/Acidity", icon: BarChart3 },
  { href: "/reports", label: "Market Trends", icon: Leaf },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  collapsed,
  onToggle,
  onNavigate,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-200",
        collapsed ? "w-[88px]" : "w-[280px]",
      )}
    >
      <div className="flex items-start justify-between border-b border-slate-200 p-4">
        {!collapsed ? (
          <div>
            <p className="text-base font-semibold text-slate-900">
              AI R&D Platform
            </p>
            <p className="text-xs text-slate-500">Beverage & Food R&D</p>
          </div>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="rounded-xl"
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center rounded-xl px-3 py-2.5 text-sm transition",
                collapsed ? "justify-center" : "gap-2.5",
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <div
          className={cn(
            "rounded-2xl border border-slate-200 bg-slate-50 p-3",
            collapsed && "p-2",
          )}
        >
          {!collapsed ? (
            <>
              <Badge variant="secondary" className="mb-2 rounded-lg">
                Pro
              </Badge>
              <p className="text-sm font-medium text-slate-900">
                Upgrade your workspace
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Get advanced analytics and team collaboration.
              </p>
              <Button className="mt-3 h-9 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                <Sparkles className="mr-2 size-4" /> Upgrade
              </Button>
            </>
          ) : (
            <Button
              className="h-9 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              size="icon"
            >
              <Sparkles className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
