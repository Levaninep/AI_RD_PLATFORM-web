"use client";

import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { reportsSeed } from "@/lib/mock";

export default function ReportsPage() {
  const [selectedId, setSelectedId] = useState(reportsSeed[0]?.id ?? "");

  const selected = useMemo(
    () => reportsSeed.find((item) => item.id === selectedId) ?? reportsSeed[0],
    [selectedId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Review summaries and export-ready documents for stakeholders."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Reports List
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {reportsSeed.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedId === item.id
                    ? "border-slate-300 bg-slate-100"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
                onClick={() => setSelectedId(item.id)}
              >
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.generatedAt}
                </p>
                <Badge
                  variant="secondary"
                  className="mt-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                >
                  {item.type}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {selected.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Generated on {selected.generatedAt}
              </p>
              <p className="mt-4 text-sm text-slate-700">{selected.summary}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button disabled className="rounded-xl">
                <FileDown className="mr-2 size-4" /> Export PDF
              </Button>
              <Button disabled variant="outline" className="rounded-xl">
                <FileDown className="mr-2 size-4" /> Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
