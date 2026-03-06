"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import { PageHeader } from "@/components/common/PageHeader";
import type { IngredientRow } from "@/lib/mock";
import { ingredientsSeed } from "@/lib/mock";

type IngredientFormState = {
  id?: string;
  name: string;
  category: IngredientRow["category"];
  supplier: string;
  brix: string;
  acidity: string;
  pricePerKg: string;
};

const defaultForm: IngredientFormState = {
  name: "",
  category: "Juice",
  supplier: "",
  brix: "",
  acidity: "",
  pricePerKg: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function IngredientsPage() {
  const [rows, setRows] = useState<IngredientRow[]>(ingredientsSeed);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [supplier, setSupplier] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<IngredientFormState>(defaultForm);

  const suppliers = useMemo(
    () => Array.from(new Set(rows.map((item) => item.supplier))),
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((item) => {
      const searchHit =
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.supplier.toLowerCase().includes(query.toLowerCase());
      const categoryHit = category === "all" || item.category === category;
      const supplierHit = supplier === "all" || item.supplier === supplier;
      return searchHit && categoryHit && supplierHit;
    });
  }, [rows, query, category, supplier]);

  function openCreate() {
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(item: IngredientRow) {
    setForm({
      id: item.id,
      name: item.name,
      category: item.category,
      supplier: item.supplier,
      brix: item.brix == null ? "" : String(item.brix),
      acidity: item.acidity == null ? "" : String(item.acidity),
      pricePerKg: String(item.pricePerKg),
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim() || !form.supplier.trim() || !form.pricePerKg.trim()) {
      return;
    }

    const payload: IngredientRow = {
      id: form.id ?? `ing-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      supplier: form.supplier.trim(),
      brix: form.brix.trim() ? Number(form.brix) : null,
      acidity: form.acidity.trim() ? Number(form.acidity) : null,
      pricePerKg: Number(form.pricePerKg),
      updated: new Date().toISOString().slice(0, 10),
    };

    setRows((prev) => {
      if (!form.id) {
        return [payload, ...prev];
      }
      return prev.map((item) => (item.id === form.id ? payload : item));
    });

    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    setRows((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingredients"
        description="Manage ingredient specifications, suppliers, and pricing."
        actions={
          <Button
            className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            onClick={openCreate}
          >
            <Plus className="mr-2 size-4" /> Add Ingredient
          </Button>
        }
      />

      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ingredients..."
            className="rounded-xl border-slate-200"
          />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="rounded-xl border-slate-200">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Sweetener">Sweetener</SelectItem>
              <SelectItem value="Juice">Juice</SelectItem>
              <SelectItem value="Acid">Acid</SelectItem>
              <SelectItem value="Flavor">Flavor</SelectItem>
              <SelectItem value="Extract">Extract</SelectItem>
            </SelectContent>
          </Select>

          <Select value={supplier} onValueChange={setSupplier}>
            <SelectTrigger className="rounded-xl border-slate-200">
              <SelectValue placeholder="Supplier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <DataTable>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Brix</TableHead>
              <TableHead>Acidity</TableHead>
              <TableHead>Price/kg</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[56px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium text-slate-900">
                  {item.name}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  >
                    {item.category}
                  </Badge>
                </TableCell>
                <TableCell>{item.supplier}</TableCell>
                <TableCell>{item.brix ?? "—"}</TableCell>
                <TableCell>{item.acidity ?? "—"}</TableCell>
                <TableCell>{formatCurrency(item.pricePerKg)}</TableCell>
                <TableCell>{item.updated}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => openEdit(item)}>
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(item)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTable>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit Ingredient" : "Add Ingredient"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              className="rounded-xl"
            />
            <Select
              value={form.category}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  category: value as IngredientRow["category"],
                }))
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sweetener">Sweetener</SelectItem>
                <SelectItem value="Juice">Juice</SelectItem>
                <SelectItem value="Acid">Acid</SelectItem>
                <SelectItem value="Flavor">Flavor</SelectItem>
                <SelectItem value="Extract">Extract</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Supplier"
              value={form.supplier}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, supplier: event.target.value }))
              }
              className="rounded-xl"
            />
            <Input
              type="number"
              placeholder="Price/kg"
              value={form.pricePerKg}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, pricePerKg: event.target.value }))
              }
              className="rounded-xl"
            />
            <Input
              type="number"
              placeholder="Brix (optional)"
              value={form.brix}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, brix: event.target.value }))
              }
              className="rounded-xl"
            />
            <Input
              type="number"
              placeholder="Acidity (optional)"
              value={form.acidity}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, acidity: event.target.value }))
              }
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              onClick={handleSave}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
