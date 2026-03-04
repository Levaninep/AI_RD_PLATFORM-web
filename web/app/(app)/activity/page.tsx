"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function ActivityPage() {
  const [query, setQuery] = useState("");
  const filtered = rows.filter((row) =>
    `${row.user} ${row.action} ${row.object} ${row.details}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Track user actions across formulations, ingredients, and tests."
        actions={<Button>Export CSV</Button>}
      />

      <Card>
        <CardContent className="p-4">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activity details"
          />
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="No activity found"
          description="Try adjusting your search query to view recent events."
        />
      ) : (
        <div className="max-h-[520px] overflow-auto rounded-md border bg-card">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/70">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Object</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <TableRow
                  key={`${row.timestamp}-${row.user}`}
                  className="hover:bg-muted/40"
                >
                  <TableCell>{row.timestamp}</TableCell>
                  <TableCell>{row.user}</TableCell>
                  <TableCell>{row.action}</TableCell>
                  <TableCell>{row.object}</TableCell>
                  <TableCell>{row.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
