"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, Plus, Search, Settings, User } from "lucide-react";
import { isDemoModeEnabled } from "@/lib/demo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const isDemoMode = isDemoModeEnabled();

  const handleLogout = () => {
    void signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-375 items-center gap-3 px-4 md:px-6">
        <Button
          variant="outline"
          size="icon"
          className="md:hidden"
          onClick={onOpenMobile}
        >
          <Menu className="size-4" />
        </Button>

        <div className="relative hidden w-full max-w-sm md:block">
          <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search formulations, ingredients..."
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isDemoMode ? (
            <Badge variant="secondary" className="hidden md:inline-flex">
              Demo mode
            </Badge>
          ) : null}
          <Button asChild size="sm">
            <Link href="/formulations">
              <Plus className="mr-1 size-4" /> New Formulation
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/ingredients">
              <Plus className="mr-1 size-4" /> Add Ingredient
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <User className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <User className="mr-2 size-4" /> User settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 size-4" /> Preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
