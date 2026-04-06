"use client";

import { useState } from "react";
import { Activity, Clock, Download, Search, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const rows = [
  {
    timestamp: "2026-03-04 09:45",
    user: "Lasha",
    action: "Updated",
    object: "Formulation",
    details: "Adjusted juice brix rule",
  },
  {
    timestamp: "2026-03-04 08:22",
    user: "Nino",
    action: "Created",
    object: "Shelf-life test",
    details: "Mango 30-day accelerated",
  },
  {
    timestamp: "2026-03-03 16:01",
    user: "Giorgi",
    action: "Imported",
    object: "Ingredients",
    details: "42 rows uploaded",
  },
];

const ACTION_COLORS: Record<string, string> = {
  Updated: "bg-amber-50 text-amber-700 border-amber-200/60",
  Created: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  Imported: "bg-blue-50 text-blue-700 border-blue-200/60",
};

export default function ActivityPage() {
  const [query, setQuery] = useState("");
  const filtered = rows.filter((row) =>
    `${row.user} ${row.action} ${row.object} ${row.details}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="relative space-y-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-amber-200/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-orange-200/20 blur-3xl" />
      </div>

      {/* Hero header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
              <Activity className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold tracking-wide text-amber-700 uppercase">
              Timeline
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Activity Log
          </h1>
          <p className="mt-1 max-w-lg text-sm text-gray-500">
            Track user actions across formulations, ingredients, and tests.
          </p>
        </div>

        <button
          type="button"
          className="group flex items-center gap-1.5 rounded-xl border border-gray-200/80 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm transition hover:border-amber-300 hover:text-amber-700 hover:shadow-md"
        >
          <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          Export CSV
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="cogs-kpi-card">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
            <Clock className="h-3.5 w-3.5" />
            Total Events
          </div>
          <p className="text-2xl font-bold text-gray-900">{rows.length}</p>
        </div>
        <div className="cogs-kpi-card">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
            <Users className="h-3.5 w-3.5" />
            Active Users
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {new Set(rows.map((r) => r.user)).size}
          </p>
        </div>
        <div className="cogs-kpi-card">
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
            <Activity className="h-3.5 w-3.5" />
            Filtered
          </div>
          <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
        </div>
      </div>

      {/* Main workspace card */}
      <div className="cogs-workspace-card">
        {/* Search bar */}
        <div className="cogs-selector-bar">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
              Search Events
            </span>
          </div>
          <div className="relative min-w-64">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by user, action, or details…"
              className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        {/* Activity table */}
        {filtered.length === 0 ? (
          <div className="cogs-empty-state">
            <Activity className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              No activity found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Try adjusting your search query to view recent events.
            </p>
          </div>
        ) : (
          <div className="cogs-table-wrapper">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100 hover:bg-transparent">
                  <TableHead className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Timestamp
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    User
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Action
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Object
                  </TableHead>
                  <TableHead className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
                    Details
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow
                    key={`${row.timestamp}-${row.user}`}
                    className="cogs-formulation-row border-b border-gray-50"
                  >
                    <TableCell className="text-sm font-medium text-gray-500">
                      {row.timestamp}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-800">
                      {row.user}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ACTION_COLORS[row.action] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
                      >
                        {row.action}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {row.object}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {row.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
