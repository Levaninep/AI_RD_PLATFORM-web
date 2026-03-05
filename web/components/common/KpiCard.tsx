import {
  ArrowDownRight,
  ArrowUpRight,
  Beaker,
  FlaskConical,
  FolderKanban,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { KpiItem } from "@/lib/mock";

function resolveIcon(icon: KpiItem["icon"]) {
  if (icon === "folder") return FolderKanban;
  if (icon === "beaker") return Beaker;
  if (icon === "flask") return FlaskConical;
  return Timer;
}

export function KpiCard({ item }: { item: KpiItem }) {
  const Icon = resolveIcon(item.icon);
  const TrendIcon = item.trend === "down" ? ArrowDownRight : ArrowUpRight;

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600">{item.title}</p>
          <Icon className="size-4 text-slate-500" />
        </div>
        <p className="mt-3 text-3xl font-semibold text-slate-900">
          {item.value}
        </p>
        <Badge
          variant="secondary"
          className="mt-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
        >
          <TrendIcon className="mr-1 size-3" />
          {item.change}
        </Badge>
      </CardContent>
    </Card>
  );
}
