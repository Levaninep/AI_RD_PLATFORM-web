"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import type { ShelfLifeTestRow } from "@/lib/mock";
import { shelfLifeTestsSeed } from "@/lib/mock";

type DraftTest = {
  product: string;
  method: ShelfLifeTestRow["method"];
  startDate: string;
  status: ShelfLifeTestRow["status"];
};

const defaultDraft: DraftTest = {
  product: "",
  method: "Accelerated",
  startDate: "",
  status: "Planned",
};

function statusClass(status: ShelfLifeTestRow["status"]) {
  if (status === "Completed")
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Running") return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function ShelfLifePage() {
  const [rows, setRows] = useState<ShelfLifeTestRow[]>(shelfLifeTestsSeed);
  const [openCreate, setOpenCreate] = useState(false);
  const [draft, setDraft] = useState<DraftTest>(defaultDraft);

  function createTest() {
    if (!draft.product.trim() || !draft.startDate) {
      return;
    }

    const next: ShelfLifeTestRow = {
      id: `sl-${Date.now()}`,
      product: draft.product.trim(),
      method: draft.method,
      startDate: draft.startDate,
      status: draft.status,
    };

    setRows((prev) => [next, ...prev]);
    setDraft(defaultDraft);
    setOpenCreate(false);
  }

  function deleteTest(id: string) {
    setRows((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shelf-Life"
        description="Track accelerated and real-time test programs."
        actions={
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                <Plus className="mr-2 size-4" /> Create Test
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Shelf-Life Test</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <Input
                  placeholder="Product"
                  value={draft.product}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      product: event.target.value,
                    }))
                  }
                  className="rounded-xl"
                />
                <select
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={draft.method}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      method: event.target.value as ShelfLifeTestRow["method"],
                    }))
                  }
                >
                  <option value="Accelerated">Accelerated</option>
                  <option value="Real-Time">Real-Time</option>
                </select>
                <Input
                  type="date"
                  value={draft.startDate}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                  className="rounded-xl"
                />
                <select
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      status: event.target.value as ShelfLifeTestRow["status"],
                    }))
                  }
                >
                  <option value="Planned">Planned</option>
                  <option value="Running">Running</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setOpenCreate(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                  onClick={createTest}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <DataTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-slate-900">
                  {item.product}
                </TableCell>
                <TableCell>{item.method}</TableCell>
                <TableCell>{item.startDate}</TableCell>
                <TableCell>
                  <Badge
                    className={`rounded-lg border ${statusClass(item.status)}`}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => deleteTest(item.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>
    </div>
  );
}
