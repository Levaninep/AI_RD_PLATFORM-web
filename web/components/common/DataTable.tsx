import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DataTable({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <ScrollArea className="w-full">
        <div className="min-w-[780px]">{children}</div>
      </ScrollArea>
    </div>
  );
}
