"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bell,
  CircleHelp,
  Menu,
  Search,
  Plus,
  FlaskConical,
  Beaker,
  TestTube2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const titleByRoute: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/ingredients": "Ingredients",
  "/formulations": "Formulations",
  "/shelf-life": "Shelf-Life",
  "/reports": "Reports",
};

export function TopHeader({ onOpenMobile }: { onOpenMobile: () => void }) {
  const pathname = usePathname();

  function handleSignOut() {
    void signOut({ callbackUrl: "/login" });
  }

  const title = useMemo(() => {
    const matched = Object.keys(titleByRoute).find(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );
    return matched ? titleByRoute[matched] : "Dashboard";
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-slate-50/95 backdrop-blur">
      <div className="flex h-20 items-center gap-4 px-4 md:px-6">
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl md:hidden"
          onClick={onOpenMobile}
        >
          <Menu className="size-4" />
        </Button>

        <div className="min-w-[180px]">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            Home <ChevronRight className="size-3" /> {title}
          </p>
        </div>

        <div className="relative mx-auto hidden w-full max-w-md lg:block">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <Input
            className="h-10 rounded-xl border-slate-200 bg-white pl-9"
            placeholder="Search ingredients, formulations, reports..."
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                <Plus className="mr-1 size-4" /> New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuItem asChild>
                <Link href="/ingredients">
                  <Beaker className="mr-2 size-4" /> New Ingredient
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/formulations">
                  <FlaskConical className="mr-2 size-4" /> New Formulation
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/shelf-life">
                  <TestTube2 className="mr-2 size-4" /> New Shelf-Life Test
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-slate-200 bg-white"
          >
            <Bell className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl border-slate-200 bg-white"
          >
            <CircleHelp className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 rounded-xl px-2">
                <Avatar>
                  <AvatarFallback>LN</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl">
              <DropdownMenuLabel>
                <p className="text-sm font-medium text-slate-900">
                  Levan Nepharidze
                </p>
                <p className="text-xs font-normal text-slate-500">
                  l.nepharidze@gmail.com
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleSignOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
