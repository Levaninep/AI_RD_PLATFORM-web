"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FlaskConical,
} from "lucide-react";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/common/KpiCard";
import { ChartCard } from "@/components/common/ChartCard";
import { DataTable } from "@/components/common/DataTable";
import {
  activityLog,
  cogsBreakdown,
  formulationActivitySeries,
  ingredientAlerts,
  kpis,
  recentFormulations,
} from "@/lib/mock";

const chartColors = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];

function statusClass(status: string) {
  if (status === "Approved")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "In Review")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function severityClass(level: "Low" | "Medium" | "High") {
  if (level === "High") return "bg-red-50 text-red-700 border-red-200";
  if (level === "Medium") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function activityIcon(type: "create" | "update" | "alert") {
  if (type === "create")
    return <CheckCircle2 className="size-4 text-emerald-600" />;
  if (type === "update") return <Clock3 className="size-4 text-blue-600" />;
  return <AlertTriangle className="size-4 text-amber-600" />;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-0">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <KpiCard key={item.title} item={item} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <ChartCard title="Cost Breakdown (COGS)">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={cogsBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={68}
                    outerRadius={108}
                    paddingAngle={3}
                  >
                    {cogsBreakdown.map((segment, index) => (
                      <Cell
                        key={segment.name}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value ?? 0}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-5">
              {cogsBreakdown.map((segment, index) => (
                <div key={segment.name} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: chartColors[index % chartColors.length],
                    }}
                  />
                  {segment.name}
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Formulation Activity">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formulationActivitySeries}>
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Recent Formulations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Category</th>
                      <th className="px-3 py-2 font-medium">Brix</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentFormulations.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {item.name}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {item.category}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {item.brix.toFixed(1)}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            className={`rounded-lg border ${statusClass(item.status)}`}
                          >
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataTable>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Tasks / Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityLog.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="mt-0.5">{activityIcon(item.type)}</div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-900">{item.text}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Ingredient Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ingredientAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center gap-2 text-sm text-slate-800">
                  <FlaskConical className="size-4 text-slate-500" />
                  {alert.message}
                </div>
                <Badge
                  className={`rounded-lg border ${severityClass(alert.severity)}`}
                >
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
