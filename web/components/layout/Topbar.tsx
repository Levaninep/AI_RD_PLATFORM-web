"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ChevronDown,
  CreditCard,
  LogOut,
  Menu,
  Search,
  Settings,
  User,
} from "lucide-react";
import { isDemoModeEnabled } from "@/lib/demo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const isDemoMode = isDemoModeEnabled();

  const handleLogout = () => {
    void signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-375 items-center gap-4 px-4 md:px-6">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 md:hidden"
          onClick={onOpenMobile}
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        {/* Search */}
        <div className="relative hidden w-full max-w-md md:block">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-2xl border border-gray-200/80 bg-gray-50/80 py-2 pr-4 pl-10 text-sm text-gray-700 shadow-sm transition placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
            placeholder="Search formulations, ingredients..."
          />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {isDemoMode ? (
            <span className="hidden rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 md:inline-flex">
              Demo
            </span>
          ) : null}

          {/* User avatar chip */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex items-center gap-2 rounded-full border border-gray-200/60 bg-white py-1 pr-2.5 pl-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300/80 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-[#3B5BFF] to-[#2F54EB] text-sm font-semibold text-white shadow-inner">
                  L
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-52 rounded-xl border border-gray-200/80 bg-white/95 p-1.5 shadow-lg backdrop-blur-xl"
            >
              <div className="mb-1 px-2.5 py-2">
                <p className="text-sm font-semibold text-gray-900">Levan</p>
                <p className="text-xs text-gray-500">l.nepharidze@gmail.com</p>
              </div>
              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuItem
                asChild
                className="rounded-lg px-2.5 py-2 text-sm"
              >
                <Link href="/settings">
                  <User className="mr-2.5 h-4 w-4 text-gray-400" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="rounded-lg px-2.5 py-2 text-sm"
              >
                <Link href="/settings">
                  <Settings className="mr-2.5 h-4 w-4 text-gray-400" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg px-2.5 py-2 text-sm"
                disabled
              >
                <CreditCard className="mr-2.5 h-4 w-4 text-gray-400" /> Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-lg px-2.5 py-2 text-sm text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <LogOut className="mr-2.5 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
