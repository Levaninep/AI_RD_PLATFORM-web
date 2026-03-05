"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import type { FormulationSummary } from "@/lib/mock";
import { formulationsSeed } from "@/lib/mock";

type DraftState = {
  name: string;
  targetBrix: string;
  targetPH: string;
  co2: string;
};

const draftDefaults: DraftState = {
  name: "",
  targetBrix: "",
  targetPH: "",
  co2: "",
};

function totalCost(lines: FormulationSummary["lines"]) {
  return lines.reduce((sum, item) => sum + item.cost, 0);
}

function DetailPanel({ formulation }: { formulation: FormulationSummary }) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-900">
          {formulation.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="rounded-xl bg-slate-100">
            <TabsTrigger value="summary" className="rounded-lg">
              Summary
            </TabsTrigger>
            <TabsTrigger value="lines" className="rounded-lg">
              Ingredient Lines
            </TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">Target Brix</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formulation.targetBrix}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">Target pH</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formulation.targetPH}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">CO₂</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {formulation.co2 ?? "—"}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <p className="text-slate-600">Computed cost (mock)</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">
                €{totalCost(formulation.lines).toFixed(2)}
              </p>
            </div>
          </TabsContent>
          <TabsContent value="lines" className="mt-4">
            <DataTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formulation.lines.map((line) => (
                    <TableRow key={`${line.ingredient}-${line.unit}`}>
                      <TableCell className="font-medium text-slate-900">
                        {line.ingredient}
                      </TableCell>
                      <TableCell>{line.amount}</TableCell>
                      <TableCell>{line.unit}</TableCell>
                      <TableCell>€{line.cost.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTable>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function FormulationsPage() {
  const [rows, setRows] = useState<FormulationSummary[]>(formulationsSeed);
  const [selectedId, setSelectedId] = useState<string>(
    formulationsSeed[0]?.id ?? "",
  );
  const [draft, setDraft] = useState<DraftState>(draftDefaults);
  const [openCreate, setOpenCreate] = useState(false);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);

  const selected = useMemo(
    () => rows.find((item) => item.id === selectedId) ?? null,
    [rows, selectedId],
  );

  function createFormulation() {
    if (
      !draft.name.trim() ||
      !draft.targetBrix.trim() ||
      !draft.targetPH.trim()
    ) {
      return;
    }

    const next: FormulationSummary = {
      id: `frm-${Date.now()}`,
      name: draft.name.trim(),
      targetBrix: Number(draft.targetBrix),
      targetPH: Number(draft.targetPH),
      co2: draft.co2.trim() ? Number(draft.co2) : null,
      lines: [
        {
          ingredient: "Apple Juice Concentrate",
          amount: 7.5,
          unit: "%",
          cost: 0.36,
        },
        { ingredient: "Citric Acid", amount: 1.2, unit: "g/L", cost: 0.07 },
      ],
    };

    setRows((prev) => [next, ...prev]);
    setSelectedId(next.id);
    setDraft(draftDefaults);
    setOpenCreate(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Formulations"
        description="Create and iterate formulation specs with fast cost feedback."
        actions={
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                <Plus className="mr-2 size-4" /> Create Formulation
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Create Formulation</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Name"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="rounded-xl md:col-span-2"
                />
                <Input
                  type="number"
                  placeholder="Target Brix"
                  value={draft.targetBrix}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      targetBrix: event.target.value,
                    }))
                  }
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="Target pH"
                  value={draft.targetPH}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      targetPH: event.target.value,
                    }))
                  }
                  className="rounded-xl"
                />
                <Input
                  type="number"
                  placeholder="CO₂ (optional)"
                  value={draft.co2}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, co2: event.target.value }))
                  }
                  className="rounded-xl md:col-span-2"
                />
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
                  onClick={createFormulation}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Formulation List
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rows.map((item) => {
              const active = item.id === selectedId;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-slate-300 bg-slate-100"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{item.name}</p>
                    <Badge
                      variant="secondary"
                      className="rounded-lg border border-slate-200 bg-slate-50"
                    >
                      Brix {item.targetBrix}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    pH {item.targetPH} · Cost €
                    {totalCost(item.lines).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    className="mt-2 rounded-xl px-0 text-sm text-slate-600 hover:bg-transparent md:hidden"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedId(item.id);
                      setMobileDetailsOpen(true);
                    }}
                  >
                    View details
                  </Button>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="hidden xl:col-span-3 xl:block">
          {selected ? (
            <DetailPanel formulation={selected} />
          ) : (
            <EmptyState
              title="No formulations"
              description="Create your first formulation to begin."
            />
          )}
        </div>
      </div>

      <Dialog open={mobileDetailsOpen} onOpenChange={setMobileDetailsOpen}>
        <DialogContent className="rounded-2xl sm:max-w-2xl">
          {selected ? <DetailPanel formulation={selected} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
